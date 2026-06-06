import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getNewsList, getBTCETFSummary, getSSIIndexes } from "@/lib/sosovalue";
import { IndexProposal, IndexToken } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { thesis, riskLevel = "medium", maxTokens = 8, investAmount = 1000 } = await req.json();

    if (!thesis || thesis.trim().length < 10) {
      return NextResponse.json({ error: "Thesis too short" }, { status: 400 });
    }

    // Fetch live context from SoSoValue
    const [news, etfData, ssiIndexes] = await Promise.all([
      getNewsList(undefined, 12),
      getBTCETFSummary(),
      getSSIIndexes(),
    ]);

    const etfContext = etfData[0]
      ? `Latest BTC ETF net inflow: $${(etfData[0].totalNetInflow / 1e6).toFixed(0)}M. Total AUM: $${(etfData[0].totalNetAssets / 1e9).toFixed(1)}B.`
      : "ETF data unavailable.";

    const newsContext = news
      .slice(0, 6)
      .map((n) => `• ${n.title} [${n.categories.join(",")}]`)
      .join("\n");

    const ssiContext = ssiIndexes
      .map((s) => `${s.indexCode}: ${s.indexValue.toFixed(1)} (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`)
      .join(", ");

    const systemPrompt = `You are ATLAS, an AI index construction engine. You build thematic crypto token baskets using institutional market data.

Available token universe (you MUST only use these):
BTC, ETH, SOL, BNB, ARB, OP, LINK, AAVE, UNI, COMP, SNX, MKR, INJ, DYDX, GMX, RENDER, TAO, FET, OCEAN, WLD, NEAR, DOT, AVAX, ATOM, TIA, MATIC, LDO, RPL, PENDLE, STX, ICP, BLUR, MAGIC, APT, SUI, SEI, PYTH, JTO, MANTA, ALT

Sectors: DeFi, Layer1, Layer2, AI, RWA, GameFi, Infrastructure, Privacy, Meme, Stablecoin

Signals: strong_buy, buy, neutral, sell, strong_sell

Risk levels:
- low: max 8 tokens, max single weight 25%, min weight 5%
- medium: max 10 tokens, max single weight 30%, min weight 4%
- high: max 12 tokens, max single weight 40%, min weight 3%

Rules:
1. Weights must sum to exactly 100
2. Include sector diversification unless thesis demands concentration
3. Base signals on the live SoSoValue data provided
4. Price field should be approximate USD current price
5. Rationale must reference specific data signals from the context provided

Return ONLY valid JSON in this exact schema:
{
  "name": "string (4-6 word descriptive name)",
  "description": "string (1-2 sentence description)",
  "tokens": [
    {
      "symbol": "string",
      "name": "string (full token name)",
      "weight": number,
      "price": number,
      "change24h": number,
      "marketCap": number,
      "sector": "string",
      "signal": "string",
      "rationale": "string (cite specific data signal from context)"
    }
  ],
  "expectedReturn": "string (e.g. +12% to +28% (30d))",
  "riskLevel": "low|medium|high|very_high",
  "aiConfidence": number (0-100),
  "rebalanceFrequency": "daily|weekly|monthly",
  "dataSignals": {
    "etfFlowSignal": "string",
    "sentimentScore": number (-100 to 100),
    "macroContext": "string",
    "newsSignals": ["string", "string", "string"]
  }
}`;

    const userPrompt = `Investment Thesis: "${thesis}"

Risk preference: ${riskLevel}
Max tokens in basket: ${maxTokens}
Investment amount: $${investAmount}

Live SoSoValue Data Context:
ETF Flow: ${etfContext}
SSI Indexes: ${ssiContext}

Recent Market News:
${newsContext}

Construct the optimal thematic index basket based on this thesis and data.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    const proposal: IndexProposal = {
      id: `idx_${Date.now()}`,
      name: parsed.name,
      description: parsed.description,
      thesis,
      tokens: parsed.tokens as IndexToken[],
      totalValue: investAmount,
      expectedReturn: parsed.expectedReturn,
      riskLevel: parsed.riskLevel,
      createdAt: Date.now(),
      rebalanceFrequency: parsed.rebalanceFrequency,
      aiConfidence: parsed.aiConfidence,
      dataSignals: parsed.dataSignals,
    };

    const key = process.env.SOSOVALUE_API_KEY ?? "";
    const dataSource = key.length > 10 && !key.includes("your_") ? "live" : "mock";

    return NextResponse.json({ proposal, dataSource });
  } catch (err) {
    console.error("[build-index]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Index construction failed" },
      { status: 500 }
    );
  }
}
