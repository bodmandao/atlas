export interface Market {
  market: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: number;
  priceChange24h: number;
  volume24h: number;
  markPrice: number;
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface SlippageEstimate {
  market: string;
  side: "buy" | "sell";
  inputAmount: number;
  expectedPrice: number;
  slippageBps: number;
  priceImpact: number;
}

const SODEX_BASE = "https://sodex.com/api";

async function sodexRequest<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SODEX_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 30 },
  });

  if (!res.ok) throw new Error(`SoDEX API error: ${res.status}`);
  return res.json();
}

export async function getMarkets(): Promise<Market[]> {
  try {
    return await sodexRequest<Market[]>("/v1/markets");
  } catch {
    return getMockMarkets();
  }
}

export async function getOrderbook(market: string): Promise<Orderbook> {
  try {
    return await sodexRequest<Orderbook>(`/v1/orderbook/${market}`);
  } catch {
    return getMockOrderbook();
  }
}

export function estimateSlippage(
  orderbook: Orderbook,
  side: "buy" | "sell",
  usdAmount: number
): SlippageEstimate {
  const levels = side === "buy" ? orderbook.asks : orderbook.bids;
  let remaining = usdAmount;
  let totalCost = 0;
  let totalQty = 0;

  for (const level of levels) {
    const levelValue = level.price * level.size;
    if (remaining <= 0) break;
    const take = Math.min(remaining, levelValue);
    const qty = take / level.price;
    totalCost += take;
    totalQty += qty;
    remaining -= take;
  }

  const avgPrice = totalQty > 0 ? totalCost / totalQty : levels[0]?.price ?? 0;
  const topPrice = levels[0]?.price ?? avgPrice;
  const slippageBps = topPrice > 0 ? Math.abs((avgPrice - topPrice) / topPrice) * 10000 : 0;

  return {
    market: "",
    side,
    inputAmount: usdAmount,
    expectedPrice: avgPrice,
    slippageBps,
    priceImpact: slippageBps / 100,
  };
}

function getMockMarkets(): Market[] {
  return [
    { market: "BTC-USDC", baseAsset: "BTC", quoteAsset: "USDC", lastPrice: 97500, priceChange24h: 2.3, volume24h: 1850000000, markPrice: 97520 },
    { market: "ETH-USDC", baseAsset: "ETH", quoteAsset: "USDC", lastPrice: 3650, priceChange24h: 1.8, volume24h: 920000000, markPrice: 3652 },
    { market: "SOL-USDC", baseAsset: "SOL", quoteAsset: "USDC", lastPrice: 182, priceChange24h: 4.1, volume24h: 380000000, markPrice: 182.5 },
    { market: "ARB-USDC", baseAsset: "ARB", quoteAsset: "USDC", lastPrice: 1.12, priceChange24h: -1.2, volume24h: 95000000, markPrice: 1.115 },
    { market: "LINK-USDC", baseAsset: "LINK", quoteAsset: "USDC", lastPrice: 18.5, priceChange24h: 3.5, volume24h: 120000000, markPrice: 18.52 },
  ];
}

function getMockOrderbook(): Orderbook {
  const mid = 97500;
  return {
    asks: Array.from({ length: 10 }, (_, i) => ({ price: mid + (i + 1) * 10, size: Math.random() * 5 })),
    bids: Array.from({ length: 10 }, (_, i) => ({ price: mid - (i + 1) * 10, size: Math.random() * 5 })),
  };
}
