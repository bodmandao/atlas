import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { theses, verificationRuns } from "./db/schema";
import type { IndexProposal } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_TURNS = 6;

// Same thresholds as the risk-tier table in build-index/route.ts's system
// prompt — reused, not restated, so the verifier can never silently drift
// from what the AI was actually told to do.
const RISK_TIERS: Record<string, { maxTokens: number; maxSingleWeight: number; minWeight: number }> = {
  low: { maxTokens: 8, maxSingleWeight: 25, minWeight: 5 },
  medium: { maxTokens: 10, maxSingleWeight: 30, minWeight: 4 },
  high: { maxTokens: 12, maxSingleWeight: 40, minWeight: 3 },
};

interface Finding {
  check: string;
  passed: boolean;
  severity: "info" | "warning" | "critical";
  message: string;
  penalty: number;
}

interface ToolCallLogEntry {
  turn: number;
  name: string;
  input: unknown;
  result: unknown;
}

export interface VerificationResult {
  status: "completed" | "failed";
  score: number | null;
  findings: Finding[] | null;
  toolCalls: ToolCallLogEntry[] | null;
  summary: string | null;
  errorMessage: string | null;
}

interface InputSnapshot {
  newsContext: string;
  etfContext: string;
  ssiContext: string;
  systemPrompt: string;
  userPrompt: string;
}

// ── Deterministic checks ────────────────────────────────────────────────
// These run unconditionally in code after the tool-use loop, regardless of
// whether the model bothered to call the matching tool during the loop.
// Structural correctness (weights sum to 100, concentration limits honored,
// data wasn't stale) is either true or false about the stored proposal — it
// is not something the model's diligence should be able to affect.

function checkWeightSum(proposal: IndexProposal) {
  const sum = proposal.tokens.reduce((s, t) => s + t.weight, 0);
  return { actualSum: Math.round(sum * 100) / 100, withinTolerance: Math.abs(sum - 100) <= 0.5 };
}

function checkConcentrationLimits(proposal: IndexProposal) {
  const tier = RISK_TIERS[proposal.riskLevel];
  if (!tier) {
    return { tierKnown: false as const, riskLevel: proposal.riskLevel };
  }
  const largest = proposal.tokens.reduce((max, t) => Math.max(max, t.weight), 0);
  const underMin = proposal.tokens.filter((t) => t.weight < tier.minWeight).map((t) => t.symbol);
  return {
    tierKnown: true as const,
    tokenCount: proposal.tokens.length,
    maxTokens: tier.maxTokens,
    countWithinLimit: proposal.tokens.length <= tier.maxTokens,
    largestWeight: largest,
    maxSingleWeight: tier.maxSingleWeight,
    largestWithinLimit: largest <= tier.maxSingleWeight,
    underMinTokens: underMin,
    allAboveMin: underMin.length === 0,
  };
}

function checkPriceStaleness(dataSourceLive: boolean, createdAt: Date, publishedAt: Date | null) {
  const buildToPublishHours = publishedAt ? (publishedAt.getTime() - createdAt.getTime()) / 3_600_000 : 0;
  return { dataSourceLive, buildToPublishHours: Math.round(buildToPublishHours * 10) / 10 };
}

// ── verify_cited_figure: the one check that needs real language ────────
// understanding to even identify what's being claimed, so unlike the three
// above, this is scored purely on what the model actually invoked.

function parseSsiContext(ssiContext: string): Map<string, number> {
  const map = new Map<string, number>();
  const re = /(\w+):\s*[\d.]+\s*\(([+-]?[\d.]+)%\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ssiContext))) {
    map.set(m[1].toLowerCase(), Number(m[2]));
  }
  return map;
}

function parseEtfContext(etfContext: string): { netInflow: number | null; totalAum: number | null } {
  const m = etfContext.match(/net inflow:\s*\$(-?[\d.]+)M\.\s*Total AUM:\s*\$([\d.]+)B/i);
  if (!m) return { netInflow: null, totalAum: null };
  return { netInflow: Number(m[1]), totalAum: Number(m[2]) };
}

interface CitedFigureInput {
  tokenSymbol: string;
  category: "ssi_change" | "etf_flow" | "news_reference";
  claimRef: string;
  claimedValue: number | null;
  claimedDirection: "up" | "down" | "flat" | "unknown";
  rawClaimText: string;
}

function verifyCitedFigure(input: CitedFigureInput, snapshot: InputSnapshot) {
  if (input.category === "ssi_change") {
    const ssiValues = parseSsiContext(snapshot.ssiContext);
    const needle = input.claimRef.toLowerCase().replace(/[^a-z]/g, "");
    let actual: number | null = null;
    for (const [code, value] of ssiValues) {
      const normalized = code.replace(/[^a-z]/g, "");
      if (normalized === needle || normalized.includes(needle) || needle.includes(normalized)) {
        actual = value;
        break;
      }
    }
    if (actual === null) {
      return { found: false, actualValue: null, actualDirection: null, withinTolerance: false, note: `No SSI index matching "${input.claimRef}" in the build-time snapshot` };
    }
    const actualDirection = actual > 0 ? "up" : actual < 0 ? "down" : "flat";
    const valueOk = input.claimedValue === null || Math.abs(Math.abs(input.claimedValue) - Math.abs(actual)) <= 0.5;
    const directionOk = input.claimedDirection === "unknown" || input.claimedDirection === actualDirection;
    return {
      found: true,
      actualValue: actual,
      actualDirection,
      withinTolerance: valueOk && directionOk,
      note: valueOk && directionOk ? "Matches build-time SSI data" : "Claimed value/direction diverges from the actual build-time SSI snapshot",
    };
  }

  if (input.category === "etf_flow") {
    const { netInflow, totalAum } = parseEtfContext(snapshot.etfContext);
    const actual = input.claimRef.toLowerCase().includes("aum") ? totalAum : netInflow;
    if (actual === null) {
      return { found: false, actualValue: null, actualDirection: null, withinTolerance: false, note: "No ETF flow data in the build-time snapshot" };
    }
    const withinTolerance =
      input.claimedValue === null
        ? true
        : Math.abs(input.claimedValue - actual) <= Math.abs(actual) * 0.1 + 0.01;
    return {
      found: true,
      actualValue: actual,
      actualDirection: actual > 0 ? "up" : actual < 0 ? "down" : "flat",
      withinTolerance,
      note: withinTolerance ? "Matches build-time ETF data" : "Claimed figure diverges more than 10% from the actual build-time ETF snapshot",
    };
  }

  // news_reference
  const haystack = snapshot.newsContext.toLowerCase();
  const keywords = input.rawClaimText
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);
  const matchedKeywords = keywords.filter((w) => haystack.includes(w));
  const found = matchedKeywords.length >= Math.min(2, keywords.length) && keywords.length > 0;
  return {
    found,
    actualValue: null,
    actualDirection: null,
    withinTolerance: found,
    note: found ? "Referenced headline found in the build-time news snapshot" : "No matching headline found in the build-time news snapshot",
  };
}

// ── Tool schemas ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "check_weight_sum",
    description: "Sum this basket's token weights and check they total 100. Call this once, early.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_concentration_limits",
    description:
      "Check this basket's token count and largest single weight against its stated risk tier's limits. Call this once, early.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_price_staleness",
    description:
      "Check whether this basket was built on live or mock market data, and how long between build and publish. Call this once, early.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "verify_cited_figure",
    description:
      "Fact-check ONE numeric or factual claim from a token's rationale text against the exact data context that was fed to the model at build time. Call this once per distinct checkable claim you find across all token rationales — a cited SSI index change, an ETF flow/AUM figure, or a referenced news headline. Skip rationales that make no checkable claim (pure qualitative reasoning).",
    input_schema: {
      type: "object",
      properties: {
        tokenSymbol: { type: "string", description: "The token whose rationale this claim came from" },
        category: { type: "string", enum: ["ssi_change", "etf_flow", "news_reference"] },
        claimRef: {
          type: "string",
          description:
            "For ssi_change: the SSI index name/code the rationale references (e.g. 'AI', 'ssiAI'). For etf_flow: 'netInflow' or 'totalAum'. For news_reference: a short keyword/phrase from the claimed headline.",
        },
        claimedValue: { type: ["number", "null"], description: "The numeric value asserted (percent or $ amount). null for news_reference." },
        claimedDirection: { type: "string", enum: ["up", "down", "flat", "unknown"] },
        rawClaimText: { type: "string", description: "The literal sentence/fragment from the rationale being checked" },
      },
      required: ["tokenSymbol", "category", "claimRef", "claimedDirection", "rawClaimText"],
    },
  },
];

const SYSTEM_PROMPT = `You are a rigor auditor for ATLAS, an AI index-construction engine. You are reviewing a basket another AI already built — you did not build it and have no stake in whether it looks good. Your job is narrow: use the provided tools to check whether the basket's stated structure (weights, concentration, data freshness) and its token rationales are actually grounded in the real data that was fed to the builder AI at construction time.

You do not get to assert a quality score — the tools return ground truth and a score is computed from their results afterward. Your job is:
1. Call check_weight_sum, check_concentration_limits, and check_price_staleness once each.
2. Read every token's rationale text. For each one that cites a specific checkable figure (an SSI index move, an ETF flow/AUM number, or a specific news headline), call verify_cited_figure with the exact claim you found. Rationales that only reason qualitatively ("strong momentum", "diversification") need no tool call.
3. After you've made all the calls you need, write a short (2-4 sentence) plain-English summary of what you found — which claims checked out, which didn't, and anything structurally off. Do not state a numeric score; one will be computed from your tool calls.`;

function buildUserPrompt(thesisText: string, proposal: IndexProposal): string {
  const rationales = proposal.tokens
    .map((t) => `${t.symbol} (weight ${t.weight}%): "${t.rationale}"`)
    .join("\n");
  return `Investment thesis: "${thesisText}"

Risk level: ${proposal.riskLevel}
Token count: ${proposal.tokens.length}

Token rationales to check:
${rationales}

Run the structural checks and fact-check any checkable claims in the rationales above.`;
}

// ── Score computation ────────────────────────────────────────────────────

function computeScore(
  weightResult: ReturnType<typeof checkWeightSum>,
  concentrationResult: ReturnType<typeof checkConcentrationLimits>,
  stalenessResult: ReturnType<typeof checkPriceStaleness>,
  citationCalls: { input: CitedFigureInput; result: ReturnType<typeof verifyCitedFigure> }[],
  truncated: boolean
): { score: number; findings: Finding[] } {
  const findings: Finding[] = [];
  let penalty = 0;

  const weightPenalty = weightResult.withinTolerance ? 0 : 25;
  penalty += weightPenalty;
  findings.push({
    check: "weight_sum",
    passed: weightResult.withinTolerance,
    severity: weightResult.withinTolerance ? "info" : "critical",
    message: weightResult.withinTolerance
      ? `Token weights sum to ${weightResult.actualSum}%`
      : `Token weights sum to ${weightResult.actualSum}%, not 100%`,
    penalty: weightPenalty,
  });

  if (!concentrationResult.tierKnown) {
    penalty += 10;
    findings.push({
      check: "concentration",
      passed: false,
      severity: "warning",
      message: `Risk tier "${concentrationResult.riskLevel}" has no defined limits — concentration could not be checked`,
      penalty: 10,
    });
  } else {
    const countPenalty = concentrationResult.countWithinLimit ? 0 : 15;
    penalty += countPenalty;
    findings.push({
      check: "concentration_count",
      passed: concentrationResult.countWithinLimit,
      severity: concentrationResult.countWithinLimit ? "info" : "critical",
      message: `${concentrationResult.tokenCount} tokens (limit ${concentrationResult.maxTokens} for this risk tier)`,
      penalty: countPenalty,
    });

    const weightPenalty2 = concentrationResult.largestWithinLimit ? 0 : 15;
    penalty += weightPenalty2;
    findings.push({
      check: "concentration_max_weight",
      passed: concentrationResult.largestWithinLimit,
      severity: concentrationResult.largestWithinLimit ? "info" : "critical",
      message: `Largest single weight ${concentrationResult.largestWeight}% (limit ${concentrationResult.maxSingleWeight}% for this risk tier)`,
      penalty: weightPenalty2,
    });

    const minPenalty = concentrationResult.allAboveMin ? 0 : 10;
    penalty += minPenalty;
    findings.push({
      check: "concentration_min_weight",
      passed: concentrationResult.allAboveMin,
      severity: concentrationResult.allAboveMin ? "info" : "warning",
      message: concentrationResult.allAboveMin
        ? "All tokens above minimum weight for this risk tier"
        : `Below minimum weight: ${concentrationResult.underMinTokens.join(", ")}`,
      penalty: minPenalty,
    });
  }

  const stalePenalty = stalenessResult.dataSourceLive ? 0 : 10;
  penalty += stalePenalty;
  findings.push({
    check: "data_freshness",
    passed: stalenessResult.dataSourceLive,
    severity: stalenessResult.dataSourceLive ? "info" : "warning",
    message: stalenessResult.dataSourceLive
      ? "Built on live SoSoValue data"
      : "Built on mock/fallback data — the SoSoValue API was unreachable at build time",
    penalty: stalePenalty,
  });

  const gapPenalty = stalenessResult.buildToPublishHours > 24 ? 5 : 0;
  penalty += gapPenalty;
  findings.push({
    check: "build_publish_gap",
    passed: gapPenalty === 0,
    severity: "info",
    message: `${stalenessResult.buildToPublishHours}h between build and publish`,
    penalty: gapPenalty,
  });

  let citationPenalty = 0;
  for (const { input, result } of citationCalls) {
    if (!result.found || !result.withinTolerance) citationPenalty += 8;
    findings.push({
      check: `citation:${input.tokenSymbol}`,
      passed: result.found && result.withinTolerance,
      severity: result.found && result.withinTolerance ? "info" : "warning",
      message: `"${input.rawClaimText}" — ${result.note}`,
      penalty: result.found && result.withinTolerance ? 0 : 8,
    });
  }
  penalty += Math.min(citationPenalty, 32);

  if (truncated) {
    penalty += 5;
    findings.push({
      check: "loop_truncated",
      passed: false,
      severity: "warning",
      message: "Verification hit its turn limit while still calling tools — some checks may be incomplete",
      penalty: 5,
    });
  }

  let score = Math.max(0, Math.min(100, 100 - penalty));

  if (citationCalls.length === 0) {
    findings.push({
      check: "citation_coverage",
      passed: false,
      severity: "critical",
      message: "No rationale claims were fact-checked — score capped, rigor unverified",
      penalty: 0,
    });
    score = Math.min(score, 40);
  }

  return { score, findings };
}

// ── Main entry point ─────────────────────────────────────────────────────

export async function runVerification(
  thesisId: string,
  opts: { triggeredBy?: "publish" | "manual" } = {}
): Promise<VerificationResult> {
  const triggeredBy = opts.triggeredBy ?? "publish";
  const model = "claude-sonnet-4-6";

  try {
    const [thesisRow] = await db.select().from(theses).where(eq(theses.id, thesisId));
    if (!thesisRow) throw new Error(`No thesis found for id ${thesisId}`);

    const proposal = thesisRow.proposal as IndexProposal;
    const snapshot = thesisRow.inputSnapshot as InputSnapshot;

    const weightResult = checkWeightSum(proposal);
    const concentrationResult = checkConcentrationLimits(proposal);
    const stalenessResult = checkPriceStaleness(thesisRow.dataSourceLive, thesisRow.createdAt, thesisRow.publishedAt);

    const toolCallLog: ToolCallLogEntry[] = [];
    const citationCalls: { input: CitedFigureInput; result: ReturnType<typeof verifyCitedFigure> }[] = [];

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserPrompt(thesisRow.thesisText, proposal) },
    ];

    let summary = "";
    let turns = 0;
    let truncated = false;

    while (turns < MAX_TURNS) {
      turns++;
      const response = await client.messages.create({
        model,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      messages.push({ role: "assistant", content: response.content as unknown as Anthropic.MessageParam["content"] });

      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock && "text" in textBlock) summary = textBlock.text;

      if (response.stop_reason !== "tool_use") break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        let result: unknown;
        switch (block.name) {
          case "check_weight_sum":
            result = weightResult;
            break;
          case "check_concentration_limits":
            result = concentrationResult;
            break;
          case "check_price_staleness":
            result = stalenessResult;
            break;
          case "verify_cited_figure": {
            const input = block.input as CitedFigureInput;
            const r = verifyCitedFigure(input, snapshot);
            citationCalls.push({ input, result: r });
            result = r;
            break;
          }
          default:
            result = { error: `Unknown tool: ${block.name}` };
        }
        toolCallLog.push({ turn: turns, name: block.name, input: block.input, result });
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: "user", content: toolResults });

      if (turns === MAX_TURNS) truncated = true;
    }

    const { score, findings } = computeScore(weightResult, concentrationResult, stalenessResult, citationCalls, truncated);

    const id = crypto.randomUUID();
    await db.insert(verificationRuns).values({
      id,
      thesisId,
      status: "completed",
      score,
      findings,
      toolCalls: toolCallLog,
      summary: summary || null,
      model,
      triggeredBy,
    });
    await db
      .update(theses)
      .set({ latestVerificationScore: score, latestVerificationStatus: "completed" })
      .where(eq(theses.id, thesisId));

    return { status: "completed", score, findings, toolCalls: toolCallLog, summary: summary || null, errorMessage: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[verifier]", thesisId, errorMessage);
    try {
      await db.insert(verificationRuns).values({
        id: crypto.randomUUID(),
        thesisId,
        status: "failed",
        model,
        errorMessage,
        triggeredBy,
      });
      await db
        .update(theses)
        .set({ latestVerificationStatus: "failed" })
        .where(eq(theses.id, thesisId));
    } catch (dbErr) {
      console.error("[verifier] failed to record failure", thesisId, dbErr);
    }
    return { status: "failed", score: null, findings: null, toolCalls: null, summary: null, errorMessage };
  }
}
