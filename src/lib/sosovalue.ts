const BASE_URL = "https://openapi.sosovalue.com/openapi/v1";

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
  perf7d: number;
  perf30d: number;
  tokens: string[];
  weights: number[];
  description?: string;
}

async function apiRequest<T>(path: string, params?: Record<string, string>): Promise<T> {
  const apiKey = process.env.SOSOVALUE_API_KEY;
  const url    = new URL(`${BASE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const label = `[SoSoValue] ${path}`;
  console.log(`${label} → ${url.toString()}`);
  console.log(`${label}   key: ${apiKey ? apiKey.slice(0, 12) + "…" : "MISSING"}`);

  const res = await fetch(url.toString(), {
    headers: {
      "x-soso-api-key": apiKey ?? "",
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  const text = await res.text();
  console.log(`${label}   status: ${res.status}`);
  console.log(`${label}   body:   ${text.slice(0, 400)}`);

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text);

  if (json.code !== 0 && json.code !== undefined) {
    throw new Error(`API error ${json.code}: ${json.message}`);
  }

  // Paginated response: { data: { list: [...] } }
  if (json.data?.list !== undefined) {
    const count = json.data.list.length;
    console.log(`${label}   ✓ parsed: ${count} items (paginated)`);
    return json.data.list as T;
  }

  // Plain data
  const data  = json.data ?? json;
  const count = Array.isArray(data) ? `${data.length} items` : "object";
  console.log(`${label}   ✓ parsed: ${count}`);
  return data as T;
}

// ── News ────────────────────────────────────────────────────────────────────

export async function getNewsListWithMeta(
  category?: string,
  limit = 20
): Promise<{ data: NewsItem[]; live: boolean }> {
  try {
    const raw = await apiRequest<Record<string, unknown>[]>("/news", {
      ...(category ? { category } : {}),
      page_size: String(limit),
      page: "1",
    });
    const data = raw.map((n) => ({
      newsId:      String(n.id ?? ""),
      title:       String(n.title ?? n.content ?? "").slice(0, 120),
      summary:     String(n.content ?? n.summary ?? "").slice(0, 300),
      publishTime: Number(n.release_time ?? n.publish_time ?? Date.now()),
      categories:  Array.isArray(n.tags) ? (n.tags as { name: string }[]).map((t) => t.name ?? t) :
                   Array.isArray(n.categories) ? n.categories as string[] : [],
      url:         String(n.source_link ?? n.original_link ?? n.url ?? "#"),
    }));
    return { data, live: true };
  } catch (err) {
    console.warn("[SoSoValue] getNewsList failed — using mock:", String(err));
    return { data: getMockNews(), live: false };
  }
}

export async function getNewsList(category?: string, limit = 20): Promise<NewsItem[]> {
  return (await getNewsListWithMeta(category, limit)).data;
}

// ── ETF ─────────────────────────────────────────────────────────────────────

export async function getBTCETFSummaryWithMeta(): Promise<{ data: ETFSummary[]; live: boolean }> {
  try {
    const raw = await apiRequest<Record<string, unknown>[]>("/etfs/summary-history", {
      symbol: "BTC",
      country_code: "US",
      limit: "30",
    });
    const data = raw.map((d) => ({
      date:            String(d.date ?? d.stat_date ?? ""),
      totalNetInflow:  Number(d.total_net_inflow  ?? d.totalNetInflow  ?? 0),
      totalNetAssets:  Number(d.total_net_assets  ?? d.totalNetAssets  ?? 0),
      btcHolding:      Number(d.btc_holding       ?? d.btcHolding      ?? 0),
    }));
    return { data, live: true };
  } catch (err) {
    console.warn("[SoSoValue] getBTCETFSummary failed — using mock:", String(err));
    return { data: getMockETFData(), live: false };
  }
}

export async function getBTCETFSummary(): Promise<ETFSummary[]> {
  return (await getBTCETFSummaryWithMeta()).data;
}

// ── SSI Indices ──────────────────────────────────────────────────────────────

const SSI_TICKERS = ["ssiDeFi", "ssiAI", "ssiLayer1", "ssiLayer2", "ssiRWA"];

const SSI_DISPLAY: Record<string, string> = {
  ssiDeFi:   "SSI DeFi Index",
  ssiAI:     "SSI AI Index",
  ssiLayer1: "SSI Layer 1 Index",
  ssiLayer2: "SSI Layer 2 Index",
  ssiRWA:    "SSI RWA Index",
};

export async function getSSIIndexesWithMeta(): Promise<{ data: SSIIndex[]; live: boolean }> {
  try {
    const results = await Promise.all(
      SSI_TICKERS.map(async (ticker) => {
        const [snap, constituents] = await Promise.all([
          apiRequest<Record<string, unknown>>(`/indices/${ticker}/market-snapshot`).catch(() => null),
          apiRequest<Record<string, unknown>[]>(`/indices/${ticker}/constituents`).catch(() => [] as Record<string, unknown>[]),
        ]);

        if (!snap) return null;

        const tokens  = (constituents as Record<string, unknown>[]).map((c) => String(c.symbol ?? c.currency ?? c.name ?? "")).filter(Boolean);
        const weights = (constituents as Record<string, unknown>[]).map((c) => Number(c.weight ?? c.allocation ?? 0));

        return {
          indexId:       ticker,
          indexName:     SSI_DISPLAY[ticker] ?? ticker,
          indexCode:     ticker,
          indexValue:    Number(snap.price ?? 0),
          changePercent: Number(snap.change_pct_24h ?? 0) * 100,
          perf7d:        Number(snap.roi_7d  ?? 0) * 100,
          perf30d:       Number(snap.roi_1m  ?? 0) * 100,
          tokens,
          weights,
          description:   "",
        };
      })
    );

    const valid = results.filter(Boolean) as SSIIndex[];
    if (valid.length === 0) throw new Error("all snapshots failed");
    console.log(`[SoSoValue] getSSIIndexes ✓ ${valid.length} indexes, tokens sample:`, valid[0]?.tokens?.slice(0, 3));
    return { data: valid, live: true };
  } catch (err) {
    console.warn("[SoSoValue] getSSIIndexes failed — using mock:", String(err));
    return { data: getMockSSI(), live: false };
  }
}

export async function getSSIIndexes(): Promise<SSIIndex[]> {
  return (await getSSIIndexesWithMeta()).data;
}

// ── Market data ──────────────────────────────────────────────────────────────

export async function getMarketDataWithMeta(
  symbols: string[]
): Promise<{ data: MarketData[]; live: boolean }> {
  try {
    const results = await Promise.all(
      symbols.map((sym) =>
        apiRequest<Record<string, unknown>>(`/currencies/${sym}/market-snapshot`)
          .then((d) => ({
            currencyCode:         sym,
            price:                Number(d.price ?? 0),
            priceChangePercent24h:Number(d.change_pct_24h ?? d.price_change_percent_24h ?? 0),
            volume24h:            Number(d.turnover_24h ?? d.volume_24h ?? 0),
            marketCap:            Number(d.marketcap ?? d.market_cap ?? 0),
          }))
          .catch(() => null)
      )
    );
    // Per-symbol failures (rate limits, one-off timeouts) are dropped, not
    // mocked — a missing symbol just means no price_history row for it today,
    // which checkpoint resolution already treats honestly as insufficient
    // data. Only total failure falls back to mock, and callers that persist
    // this data (the price-history pipeline) must know that happened so they
    // don't write fabricated prices into what's supposed to be a real record.
    const valid = results.filter(Boolean) as MarketData[];
    if (valid.length === 0) throw new Error("all symbols failed");
    return { data: valid, live: true };
  } catch (err) {
    console.warn("[SoSoValue] getMarketData failed — using mock:", String(err));
    return { data: getMockMarketData(symbols), live: false };
  }
}

export async function getMarketData(symbols: string[]): Promise<MarketData[]> {
  return (await getMarketDataWithMeta(symbols)).data;
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
    { indexId: "ssiDeFi",   indexName: "SSI DeFi Index",    indexCode: "ssiDeFi",   indexValue: 5.29,  changePercent: -6.88, perf7d: -12.8, perf30d: -6.6,  tokens: ["AAVE","UNI","MKR","COMP","SNX"],    weights: [30,25,20,15,10] },
    { indexId: "ssiAI",     indexName: "SSI AI Index",      indexCode: "ssiAI",     indexValue: 3.90,  changePercent: -5.81, perf7d: -5.2,  perf30d: -19.4, tokens: ["FET","RENDER","TAO","WLD","OCEAN"],  weights: [28,24,22,16,10] },
    { indexId: "ssiLayer1", indexName: "SSI Layer 1 Index", indexCode: "ssiLayer1", indexValue: 7.46,  changePercent: -3.45, perf7d: -11.1, perf30d: -24.9, tokens: ["ETH","SOL","BNB","AVAX","NEAR"],     weights: [35,25,20,12,8]  },
    { indexId: "ssiLayer2", indexName: "SSI Layer 2 Index", indexCode: "ssiLayer2", indexValue: 0.57,  changePercent: -4.74, perf7d: -14.3, perf30d: -31.8, tokens: ["ARB","OP","MATIC","MANTA","ALT"],    weights: [32,28,20,12,8]  },
    { indexId: "ssiRWA",    indexName: "SSI RWA Index",     indexCode: "ssiRWA",    indexValue: 4.63,  changePercent: -5.39, perf7d: -11.5, perf30d: -24.0, tokens: ["LINK","PENDLE","MKR","ONDO","TRU"],  weights: [30,25,20,15,10] },
  ];
}
