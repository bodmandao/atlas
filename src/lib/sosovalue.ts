const BASE_URL = "https://open-api.sosovalue.com";

export interface NewsItem {
  newsId: string;
  title: string;
  summary: string;
  publishTime: number;
  categories: string[];
  url: string;
  currencyCode?: string;
}

export interface ETFSummary {
  date: string;
  totalNetInflow: number;
  totalNetAssets: number;
  btcHolding: number;
}

export interface MarketData {
  currencyCode: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
}

export interface SSIIndex {
  indexId: string;
  indexName: string;
  indexCode: string;
  indexValue: number;
  changePercent: number;
  description?: string;
}

async function apiRequest<T>(path: string, params?: Record<string, string>): Promise<T> {
  const apiKey = process.env.SOSOVALUE_API_KEY;
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`SoSoValue API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.data ?? data;
}

export async function getNewsList(category?: string, limit = 20): Promise<NewsItem[]> {
  try {
    return await apiRequest<NewsItem[]>("/v1/news/list", {
      ...(category ? { category } : {}),
      limit: String(limit),
    });
  } catch {
    return getMockNews();
  }
}

export async function getBTCETFSummary(): Promise<ETFSummary[]> {
  try {
    return await apiRequest<ETFSummary[]>("/etfs/summary-history", {
      type: "BTC",
      limit: "30",
    });
  } catch {
    return getMockETFData();
  }
}

export async function getMarketData(symbols: string[]): Promise<MarketData[]> {
  try {
    return await apiRequest<MarketData[]>("/v1/coins/market-data", {
      currencyCodes: symbols.join(","),
    });
  } catch {
    return getMockMarketData(symbols);
  }
}

export async function getSSIIndexes(): Promise<SSIIndex[]> {
  try {
    return await apiRequest<SSIIndex[]>("/v1/indexes/list");
  } catch {
    return getMockSSI();
  }
}

// ── Mock fallbacks ──────────────────────────────────────────────────────────

function getMockNews(): NewsItem[] {
  return [
    { newsId: "1", title: "BlackRock Bitcoin ETF Records $500M Inflow", summary: "Institutional demand surges as BlackRock ETF sees record inflow day.", publishTime: Date.now() - 3600000, categories: ["ETF", "BTC"], url: "#" },
    { newsId: "2", title: "Ethereum Layer 2 Ecosystem Hits $50B TVL", summary: "Combined TVL across L2 networks reaches new all-time high driven by Arbitrum and Base.", publishTime: Date.now() - 7200000, categories: ["L2", "ETH"], url: "#" },
    { newsId: "3", title: "DeFi Lending Protocols See 40% Volume Increase", summary: "On-chain lending activity spikes as yield opportunities attract capital rotation.", publishTime: Date.now() - 10800000, categories: ["DeFi"], url: "#" },
    { newsId: "4", title: "AI Token Sector Outperforms Market by 12%", summary: "AI-focused crypto projects lead weekly gains amid broader market consolidation.", publishTime: Date.now() - 14400000, categories: ["AI", "Altcoins"], url: "#" },
    { newsId: "5", title: "RWA Tokenization Market Reaches $8B", summary: "Real world assets on-chain accelerates with new institutional partnerships.", publishTime: Date.now() - 18000000, categories: ["RWA"], url: "#" },
  ];
}

function getMockETFData(): ETFSummary[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
    totalNetInflow: (Math.random() - 0.3) * 800000000,
    totalNetAssets: 58000000000 + Math.random() * 5000000000,
    btcHolding: 550000 + Math.random() * 10000,
  }));
}

function getMockMarketData(symbols: string[]): MarketData[] {
  const prices: Record<string, number> = {
    BTC: 97500, ETH: 3650, SOL: 182, ARB: 1.12, OP: 2.45,
    LINK: 18.5, AAVE: 285, UNI: 11.2, RENDER: 8.9, WLD: 3.1,
    INJ: 32.4, FET: 2.8, OCEAN: 1.45, TAO: 485, NEAR: 7.8,
  };
  return symbols.map((s) => ({
    currencyCode: s,
    price: prices[s] ?? Math.random() * 100,
    priceChangePercent24h: (Math.random() - 0.4) * 20,
    volume24h: Math.random() * 2000000000,
    marketCap: Math.random() * 50000000000,
  }));
}

function getMockSSI(): SSIIndex[] {
  return [
    { indexId: "1", indexName: "SSI DeFi Index", indexCode: "SSIDF", indexValue: 1284.5, changePercent: 3.2, description: "Top DeFi protocols by TVL" },
    { indexId: "2", indexName: "SSI Layer1 Index", indexCode: "SSIL1", indexValue: 2156.8, changePercent: 1.8, description: "Leading Layer 1 blockchains" },
    { indexId: "3", indexName: "SSI Layer2 Index", indexCode: "SSIL2", indexValue: 892.3, changePercent: 5.1, description: "Ethereum scaling solutions" },
    { indexId: "4", indexName: "SSI AI Index", indexCode: "SSIAI", indexValue: 634.2, changePercent: 7.4, description: "AI-focused crypto projects" },
    { indexId: "5", indexName: "SSI RWA Index", indexCode: "SSIWA", indexValue: 445.7, changePercent: 2.9, description: "Real world asset protocols" },
  ];
}
