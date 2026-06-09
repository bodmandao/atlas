import { getSSIIndexes, getNewsList, getBTCETFSummary, SSIIndex } from "@/lib/sosovalue";
import { Activity, Newspaper } from "lucide-react";

export const revalidate = 60;

// Token universe mapped to SSI sectors
const TOKEN_UNIVERSE = [
  { symbol: "TAO",    name: "Bittensor",      sector: "ssiAI"     },
  { symbol: "RENDER", name: "Render Network", sector: "ssiAI"     },
  { symbol: "FET",    name: "Fetch.ai",       sector: "ssiAI"     },
  { symbol: "WLD",    name: "Worldcoin",      sector: "ssiAI"     },
  { symbol: "AAVE",   name: "Aave",           sector: "ssiDeFi"   },
  { symbol: "UNI",    name: "Uniswap",        sector: "ssiDeFi"   },
  { symbol: "GMX",    name: "GMX",            sector: "ssiDeFi"   },
  { symbol: "INJ",    name: "Injective",      sector: "ssiDeFi"   },
  { symbol: "MKR",    name: "Maker",          sector: "ssiDeFi"   },
  { symbol: "ETH",    name: "Ethereum",       sector: "ssiLayer1" },
  { symbol: "SOL",    name: "Solana",         sector: "ssiLayer1" },
  { symbol: "NEAR",   name: "NEAR Protocol",  sector: "ssiLayer1" },
  { symbol: "AVAX",   name: "Avalanche",      sector: "ssiLayer1" },
  { symbol: "ARB",    name: "Arbitrum",       sector: "ssiLayer2" },
  { symbol: "OP",     name: "Optimism",       sector: "ssiLayer2" },
  { symbol: "MATIC",  name: "Polygon",        sector: "ssiLayer2" },
  { symbol: "LINK",   name: "Chainlink",      sector: "ssiRWA"    },
  { symbol: "PENDLE", name: "Pendle",         sector: "ssiRWA"    },
];

const SECTOR_DISPLAY: Record<string, string> = {
  ssiAI: "AI", ssiDeFi: "DeFi", ssiLayer1: "Layer1", ssiLayer2: "Layer2", ssiRWA: "RWA",
};
const SECTOR_COLORS: Record<string, string> = {
  AI: "#d4a841", DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4", RWA: "#00e676",
};
const SIGNAL_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  strong_buy:  { label: "Strong Buy",  bg: "rgba(0,230,118,0.12)", text: "#00e676", icon: "▲▲" },
  buy:         { label: "Buy",         bg: "rgba(0,230,118,0.06)", text: "#6ee7b7", icon: "▲"  },
  neutral:     { label: "Neutral",     bg: "rgba(212,168,65,0.08)", text: "#d4a841", icon: "●" },
  sell:        { label: "Sell",        bg: "rgba(255,68,68,0.08)",  text: "#ff4444", icon: "▼" },
  strong_sell: { label: "Strong Sell", bg: "rgba(255,68,68,0.12)", text: "#ff4444", icon: "▼▼" },
};

function scoreToken(
  ticker: string,
  ssiMap: Map<string, SSIIndex>,
  etfFlow: number,
  newsText: string,
  symbol: string
): number {
  const ssi = ssiMap.get(ticker);
  let score = 50;

  if (ssi) {
    score += Math.max(-28, Math.min(28, ssi.perf7d * 2.2));
    score += Math.max(-14, Math.min(14, ssi.changePercent * 1.8));
  }

  score += etfFlow > 0 ? 8 : -5;

  const mentions = (newsText.match(new RegExp(symbol, "gi")) ?? []).length;
  score += Math.min(10, mentions * 3);

  // Stable per-token variance so same symbol always ranks consistently
  const hash = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  score += (hash % 11) - 5;

  return Math.max(5, Math.min(97, Math.round(score)));
}

function signalFromScore(score: number): string {
  if (score >= 75) return "strong_buy";
  if (score >= 60) return "buy";
  if (score >= 40) return "neutral";
  if (score >= 25) return "sell";
  return "strong_sell";
}

function buildSources(ticker: string, ssi: SSIIndex | undefined, etfFlow: number, mentions: number): string[] {
  const src: string[] = [];
  if (ssi) {
    const label = SECTOR_DISPLAY[ticker] ?? ticker;
    src.push(`SSI ${label}: ${ssi.perf7d >= 0 ? "+" : ""}${ssi.perf7d.toFixed(1)}% (7d)`);
    src.push(`24h: ${ssi.changePercent >= 0 ? "+" : ""}${ssi.changePercent.toFixed(2)}%`);
  }
  const flowM = Math.abs(etfFlow / 1e6).toFixed(0);
  src.push(`BTC ETF: ${etfFlow >= 0 ? "+" : "-"}$${flowM}M`);
  if (mentions > 0) src.push(`News: ${mentions} mention${mentions > 1 ? "s" : ""}`);
  return src.slice(0, 3);
}

export default async function SignalsPage() {
  const [etfData, ssiIndexes, news] = await Promise.all([
    getBTCETFSummary(),
    getSSIIndexes(),
    getNewsList(undefined, 10),
  ]);

  const etfFlow  = etfData[0]?.totalNetInflow ?? 0;
  const newsText = news.map((n) => `${n.title} ${n.summary}`).join(" ");
  const ssiMap   = new Map(ssiIndexes.map((s) => [s.indexCode, s]));

  const signals = TOKEN_UNIVERSE.map((t) => {
    const score   = scoreToken(t.sector, ssiMap, etfFlow, newsText, t.symbol);
    const signal  = signalFromScore(score);
    const ssi     = ssiMap.get(t.sector);
    const mentions = (newsText.match(new RegExp(t.symbol, "gi")) ?? []).length;
    return {
      ...t,
      score,
      signal,
      sectorLabel: SECTOR_DISPLAY[t.sector] ?? t.sector,
      sources: buildSources(t.sector, ssi, etfFlow, mentions),
    };
  }).sort((a, b) => b.score - a.score);

  const bullish = signals.filter((s) => s.signal === "strong_buy" || s.signal === "buy").length;
  const neutral = signals.filter((s) => s.signal === "neutral").length;
  const bearish = signals.filter((s) => s.signal === "sell"      || s.signal === "strong_sell").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--green-dim)", color: "var(--green)" }}>
            <Activity size={18} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Live Signals</h1>
          <span className="badge badge-green">
            <span className="live-dot" style={{ width: 5, height: 5 }} /> SoSoValue Powered
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--t-2)" }}>
          Token signals derived from live SoSoValue SSI sector performance, BTC ETF flows, and news mentions
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card text-center">
          <div className="num-xl mono up mb-1">{bullish}</div>
          <div className="label-caps">Bullish</div>
        </div>
        <div className="metric-card text-center">
          <div className="num-xl mono mb-1" style={{ color: "var(--amber)" }}>{neutral}</div>
          <div className="label-caps">Neutral</div>
        </div>
        <div className="metric-card text-center">
          <div className="num-xl mono down mb-1">{bearish}</div>
          <div className="label-caps">Bearish</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Signal rows */}
        <div className="lg:col-span-2 space-y-3">
          <div className="label-caps">Token Signals</div>
          {signals.map((s) => {
            const cfg         = SIGNAL_CONFIG[s.signal];
            const sectorColor = SECTOR_COLORS[s.sectorLabel] ?? "#8aa3c4";
            return (
              <div key={s.symbol} className="glass-row p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${sectorColor}20`, color: sectorColor, border: `1px solid ${sectorColor}40` }}>
                    {s.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{s.symbol}</span>
                      <span className="text-xs" style={{ color: "var(--t-3)" }}>{s.sectorLabel}</span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {s.sources.slice(0, 2).map((src, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--cyan-dim)", color: "var(--t-2)", border: "1px solid var(--border-2)" }}>
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <div className="label-caps mb-1">Score</div>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-12 h-1.5 rounded-full" style={{ background: "var(--border-1)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${s.score}%`, background: s.score > 70 ? "var(--green)" : s.score > 40 ? "var(--amber)" : "var(--red)" }} />
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: "var(--t-2)" }}>{s.score}</span>
                    </div>
                  </div>
                  <div className="badge hidden sm:inline-flex flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.text}30` }}>
                    {cfg.icon} {cfg.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="label-caps">SoSoValue Data</div>

          <div className="glass p-4">
            <div className="label-caps mb-3">SSI Sector Indexes</div>
            <div className="space-y-3">
              {ssiIndexes.map((idx) => (
                <div key={idx.indexId} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold" style={{ color: "var(--t-2)" }}>
                      {SECTOR_DISPLAY[idx.indexCode] ?? idx.indexCode}
                    </div>
                    <div className="text-xs" style={{ color: "var(--t-3)" }}>
                      7d: <span style={{ color: idx.perf7d >= 0 ? "var(--green)" : "var(--red)" }}>
                        {idx.perf7d >= 0 ? "+" : ""}{idx.perf7d.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold" style={{ color: "var(--t-1)" }}>
                      {idx.indexValue.toFixed(3)}
                    </div>
                    <div className="text-xs" style={{ color: idx.changePercent >= 0 ? "var(--green)" : "var(--red)" }}>
                      {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {etfData[0] && (
            <div className="glass p-4">
              <div className="label-caps mb-3">BTC ETF Flow</div>
              <div className="space-y-3">
                <div>
                  <div className="label-caps mb-1">Daily Net Inflow</div>
                  <div className="num-lg mono"
                    style={{ color: etfData[0].totalNetInflow >= 0 ? "var(--green)" : "var(--red)" }}>
                    {etfData[0].totalNetInflow >= 0 ? "+" : ""}${(etfData[0].totalNetInflow / 1e6).toFixed(0)}M
                  </div>
                </div>
                <div className="sep" />
                <div>
                  <div className="label-caps mb-1">Total AUM</div>
                  <div className="text-base font-bold font-mono" style={{ color: "var(--t-1)" }}>
                    ${(etfData[0].totalNetAssets / 1e9).toFixed(1)}B
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass p-4">
            <div className="label-caps mb-3">Recent News</div>
            <div className="space-y-3">
              {news.slice(0, 4).map((item) => (
                <div key={item.newsId} className="flex items-start gap-2">
                  <Newspaper size={12} className="flex-shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
                  <div>
                    <div className="text-xs leading-snug mb-1" style={{ color: "var(--t-2)" }}>
                      {item.title || item.summary.slice(0, 80)}
                    </div>
                    <div className="flex gap-1">
                      {item.categories.slice(0, 2).map((c) => (
                        <span key={c} className="badge badge-cyan" style={{ fontSize: "9px", padding: "2px 6px" }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
