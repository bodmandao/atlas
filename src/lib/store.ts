import { desc, eq } from "drizzle-orm";
import { db } from "./db/client";
import { portfolioPositions, publishedIndexes, theses } from "./db/schema";

// ── Portfolio positions ──────────────────────────────────────────────────────

export interface PortfolioToken {
  symbol: string;
  sector: string;
  weight: number;
  allocUSD: number;
  filledQty: number;
  fillPrice: number;
}

export interface PortfolioPosition {
  id: string;
  indexName: string;
  indexId: string | null;
  thesisId: string | null;
  allocatedUSD: number;
  bundleTxHash: string;
  network: string;
  createdAt: number;
  live: boolean;
  simulated: boolean;
  simulatedReason: string | null;
  tokens: PortfolioToken[];
}

export async function addPortfolioPosition(pos: {
  indexName: string;
  indexId?: string | null;
  thesisId?: string | null;
  allocatedUSD: number;
  bundleTxHash: string;
  network: string;
  live: boolean;
  simulated: boolean;
  simulatedReason?: string | null;
  tokens: PortfolioToken[];
}): Promise<void> {
  await db.insert(portfolioPositions).values({
    id: pos.bundleTxHash,
    indexName: pos.indexName,
    indexId: pos.indexId ?? null,
    thesisId: pos.thesisId ?? null,
    allocatedUsd: String(pos.allocatedUSD),
    bundleTxHash: pos.bundleTxHash,
    network: pos.network,
    live: pos.live,
    simulated: pos.simulated,
    simulatedReason: pos.simulatedReason ?? null,
    tokens: pos.tokens,
  });
}

export async function getPortfolioPositions(): Promise<PortfolioPosition[]> {
  const rows = await db
    .select()
    .from(portfolioPositions)
    .orderBy(desc(portfolioPositions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    indexName: r.indexName,
    indexId: r.indexId,
    thesisId: r.thesisId,
    allocatedUSD: Number(r.allocatedUsd),
    bundleTxHash: r.bundleTxHash,
    network: r.network,
    createdAt: r.createdAt.getTime(),
    live: r.live,
    simulated: r.simulated,
    simulatedReason: r.simulatedReason,
    tokens: r.tokens as PortfolioToken[],
  }));
}

// ── Published indexes ────────────────────────────────────────────────────────

export interface StoredIndex {
  id: string;
  thesisId: string;
  name: string;
  description: string;
  thesis: string;
  tokens: string[];
  sector: string;
  riskLevel: string;
  aiConfidence: number;
  creator: string;
  canonicalHash: string;
  publishedAt: number;
  aum: number;
  subscribers: number;
  perf7d: number | null;
  perf30d: number | null;
  verification: { score: number | null; status: string | null };
}

// A published index always originates from a persisted, hash-anchored thesis
// row — the caller passes the thesis id, never a raw client-supplied basket,
// so what gets published is provably what the AI generated at build time.
export async function addPublishedIndex(input: {
  thesisId: string;
  creatorHandle: string;
  creatorName?: string | null;
}): Promise<StoredIndex> {
  const [thesisRow] = await db.select().from(theses).where(eq(theses.id, input.thesisId));
  if (!thesisRow) {
    throw new Error(`No thesis found for id ${input.thesisId}`);
  }
  if (thesisRow.status === "published") {
    throw new Error(`Thesis ${input.thesisId} is already published`);
  }

  const proposal = thesisRow.proposal as {
    id: string;
    name: string;
    description: string;
    tokens: { symbol: string; sector: string }[];
    riskLevel: string;
    aiConfidence: number;
    totalValue: number;
  };

  const id = crypto.randomUUID();
  const publishedAt = new Date();

  await db.insert(publishedIndexes).values({
    id,
    thesisId: input.thesisId,
    name: proposal.name,
    description: proposal.description,
    thesisText: thesisRow.thesisText,
    sector: proposal.tokens[0]?.sector ?? "Mixed",
    riskLevel: proposal.riskLevel,
    aiConfidence: proposal.aiConfidence,
    creatorHandle: input.creatorHandle,
    creatorName: input.creatorName ?? null,
    tokens: proposal.tokens.map((t) => t.symbol),
    canonicalHash: thesisRow.canonicalHash,
    publishedAt,
    aum: String(proposal.totalValue),
    subscribers: 1,
  });

  await db
    .update(theses)
    .set({
      status: "published",
      publishedAt,
      creatorHandle: input.creatorHandle,
      creatorName: input.creatorName ?? null,
    })
    .where(eq(theses.id, input.thesisId));

  return {
    id,
    thesisId: input.thesisId,
    name: proposal.name,
    description: proposal.description,
    thesis: thesisRow.thesisText,
    tokens: proposal.tokens.map((t) => t.symbol),
    sector: proposal.tokens[0]?.sector ?? "Mixed",
    riskLevel: proposal.riskLevel,
    aiConfidence: proposal.aiConfidence,
    creator: input.creatorName ?? input.creatorHandle,
    canonicalHash: thesisRow.canonicalHash,
    publishedAt: publishedAt.getTime(),
    aum: proposal.totalValue,
    subscribers: 1,
    perf7d: null,
    perf30d: null,
    verification: { score: null, status: null }, // publish-index sets status to 'pending' right after this returns
  };
}

// Called only when a t+7d/t+30d checkpoint actually resolves — perf7d/perf30d
// stay null (rendered "Pending T+7d") until then, never hardcoded to 0.
export async function updatePublishedIndexPerf(
  thesisId: string,
  horizon: "t+7d" | "t+30d",
  realizedReturnPercent: number
): Promise<void> {
  const field = horizon === "t+7d" ? { perf7d: String(realizedReturnPercent) } : { perf30d: String(realizedReturnPercent) };
  await db.update(publishedIndexes).set(field).where(eq(publishedIndexes.thesisId, thesisId));
}

export async function getPublishedIndexes(): Promise<StoredIndex[]> {
  const rows = await db
    .select({ index: publishedIndexes, thesis: theses })
    .from(publishedIndexes)
    .leftJoin(theses, eq(publishedIndexes.thesisId, theses.id))
    .orderBy(desc(publishedIndexes.publishedAt));

  return rows.map(({ index: r, thesis: t }) => ({
    id: r.id,
    thesisId: r.thesisId,
    name: r.name,
    description: r.description,
    thesis: r.thesisText,
    tokens: r.tokens as string[],
    sector: r.sector,
    riskLevel: r.riskLevel,
    aiConfidence: r.aiConfidence,
    creator: r.creatorName ?? r.creatorHandle,
    canonicalHash: r.canonicalHash,
    publishedAt: r.publishedAt.getTime(),
    aum: Number(r.aum),
    subscribers: r.subscribers,
    perf7d: r.perf7d === null ? null : Number(r.perf7d),
    perf30d: r.perf30d === null ? null : Number(r.perf30d),
    verification: { score: t?.latestVerificationScore ?? null, status: t?.latestVerificationStatus ?? null },
  }));
}
