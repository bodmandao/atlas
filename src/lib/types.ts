export type Sector =
  | "DeFi" | "Layer1" | "Layer2" | "AI" | "RWA"
  | "GameFi" | "Infrastructure" | "Privacy" | "Meme" | "Stablecoin";

export type SignalStrength = "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
export type RiskLevel = "low" | "medium" | "high" | "very_high";

export interface IndexToken {
  symbol: string;
  name: string;
  weight: number;
  price: number;
  change24h: number;
  marketCap: number;
  sector: Sector;
  signal: SignalStrength;
  rationale: string;
  logoUrl?: string;
}

export interface IndexProposal {
  id: string;
  name: string;
  description: string;
  thesis: string;
  tokens: IndexToken[];
  totalValue: number;
  expectedReturn: string;
  riskLevel: RiskLevel;
  createdAt: number;
  rebalanceFrequency: "daily" | "weekly" | "monthly";
  aiConfidence: number;
  dataSignals: {
    etfFlowSignal: string;
    sentimentScore: number;
    macroContext: string;
    newsSignals: string[];
  };
}

export interface Portfolio {
  id: string;
  indexId: string;
  indexName: string;
  allocatedUSD: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  tokens: PortfolioPosition[];
  createdAt: number;
  lastRebalanced: number;
}

export interface PortfolioPosition {
  symbol: string;
  allocatedUSD: number;
  currentValue: number;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
}

export interface PublishedIndex {
  id: string;
  name: string;
  creator: string;
  creatorAddress: string;
  thesis: string;
  tokens: string[];
  performance7d: number;
  performance30d: number;
  aum: number;
  subscribers: number;
  riskLevel: RiskLevel;
  sector: Sector;
  createdAt: number;
  verified: boolean;
}

export interface ExecutionPlan {
  legs: ExecutionLeg[];
  totalUSD: number;
  estimatedFees: number;
  estimatedSlippage: number;
  executionTime: string;
}

export interface ExecutionLeg {
  symbol: string;
  side: "buy" | "sell";
  usdAmount: number;
  estimatedQty: number;
  estimatedPrice: number;
  slippageBps: number;
  market: string;
}
