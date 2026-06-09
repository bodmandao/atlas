import type { IndexProposal } from "./types";

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
  indexId: string;
  allocatedUSD: number;
  bundleTxHash: string;
  network: string;
  createdAt: number;
  live: boolean;
  tokens: PortfolioToken[];
}

const _portfolio: PortfolioPosition[] = [];

export function addPortfolioPosition(pos: PortfolioPosition): void {
  _portfolio.unshift(pos);
}

export function getPortfolioPositions(): PortfolioPosition[] {
  return [..._portfolio];
}

// ── Published indexes ────────────────────────────────────────────────────────

export interface StoredIndex {
  id: string;
  name: string;
  description: string;
  thesis: string;
  tokens: string[];
  sector: string;
  riskLevel: string;
  aiConfidence: number;
  creator: string;
  publishedAt: number;
  aum: number;
  subscribers: number;
  perf7d: number;
  perf30d: number;
}

const _store: StoredIndex[] = [];

export function addPublishedIndex(proposal: IndexProposal): StoredIndex {
  const entry: StoredIndex = {
    id: proposal.id,
    name: proposal.name,
    description: proposal.description,
    thesis: proposal.thesis,
    tokens: proposal.tokens.map((t) => t.symbol),
    sector: proposal.tokens[0]?.sector ?? "Mixed",
    riskLevel: proposal.riskLevel,
    aiConfidence: proposal.aiConfidence,
    creator: "You",
    publishedAt: Date.now(),
    aum: proposal.totalValue,
    subscribers: 1,
    perf7d: 0,
    perf30d: 0,
  };
  _store.unshift(entry);
  return entry;
}

export function getPublishedIndexes(): StoredIndex[] {
  return [..._store];
}
