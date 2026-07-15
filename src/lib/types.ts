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

