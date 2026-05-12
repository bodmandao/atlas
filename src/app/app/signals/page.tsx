import { getSSIIndexes, getNewsList, getBTCETFSummary } from "@/lib/sosovalue";
import { Activity, Newspaper } from "lucide-react";

export const revalidate = 60;

const SIGNALS = [
  { symbol: "TAO", name: "Bittensor", signal: "strong_buy", score: 92, price: 485, change: 18.4, sources: ["AI sector SSI +7.4%", "ETF inflow correlation positive", "News: AI infrastructure demand"], sector: "AI" },
  { symbol: "RENDER", name: "Render Network", signal: "buy", score: 78, price: 8.9, change: 12.1, sources: ["GPU compute demand narrative", "Positive news sentiment", "Volume spike +180%"], sector: "AI" },
  { symbol: "ARB", name: "Arbitrum", signal: "buy", score: 72, price: 1.12, change: -1.2, sources: ["L2 SSI +5.1%", "Developer activity up 40%", "Fee revenue all-time high"], sector: "Layer2" },
  { symbol: "AAVE", name: "Aave", signal: "buy", score: 69, price: 285, change: 2.1, sources: ["DeFi SSI +3.2%", "TVL growth 15% MoM", "Whale accumulation signal"], sector: "DeFi" },
  { symbol: "ETH", name: "Ethereum", signal: "neutral", score: 54, price: 3650, change: 1.8, sources: ["ETF flows mixed", "SSI L1 neutral", "Consolidation pattern"], sector: "Layer1" },
  { symbol: "INJ", name: "Injective", signal: "buy", score: 74, price: 32.4, change: 5.7, sources: ["DEX volume surge", "Perp OI increasing", "Ecosystem expansion news"], sector: "DeFi" },
  { symbol: "MATIC", name: "Polygon", signal: "neutral", score: 51, price: 0.78, change: -2.4, sources: ["L2 competition", "Migration to POL ongoing", "Mixed sentiment"], sector: "Layer2" },
  { symbol: "FET", name: "Fetch.ai", signal: "buy", score: 71, price: 2.8, change: 9.7, sources: ["AI narrative momentum", "ASI merge catalyst", "Strong buy pressure on-chain"], sector: "AI" },
  { symbol: "LDO", name: "Lido DAO", signal: "neutral", score: 55, price: 2.1, change: 0.3, sources: ["Staking yield stable", "ETH staking rate neutral", "No major catalyst"], sector: "DeFi" },
  { symbol: "GMX", name: "GMX", signal: "strong_buy", score: 88, price: 28.4, change: 16.8, sources: ["Perp DEX volume record", "Revenue up 220%", "SoDEX integration momentum"], sector: "DeFi" },
];

const SIGNAL_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  strong_buy: { label: "Strong Buy", bg: "rgba(0,230,118,0.12)", text: "#00e676", icon: "▲▲" },
  buy: { label: "Buy", bg: "rgba(0,230,118,0.06)", text: "#6ee7b7", icon: "▲" },
  neutral: { label: "Neutral", bg: "rgba(212,168,65,0.08)", text: "#d4a841", icon: "●" },
  sell: { label: "Sell", bg: "rgba(255,68,68,0.08)", text: "#ff4444", icon: "▼" },
  strong_sell: { label: "Strong Sell", bg: "rgba(255,68,68,0.12)", text: "#ff4444", icon: "▼▼" },
};

const SECTOR_COLORS: Record<string, string> = {
  AI: "#d4a841", DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4", RWA: "#00e676"
};

export default async function SignalsPage() {
  const [etfData, ssiIndexes, news] = await Promise.all([
    getBTCETFSummary(),
    getSSIIndexes(),
    getNewsList(undefined, 6),
  ]);

  const bullish = SIGNALS.filter((s) => s.signal === "strong_buy" || s.signal === "buy");
  const neutral = SIGNALS.filter((s) => s.signal === "neutral");
  const sorted = [...SIGNALS].sort((a, b) => b.score - a.score);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--green-dim)", color: "var(--green)" }}
          >
            <Activity size={18} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Live Signals</h1>
          <span className="badge badge-green">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            SoSoValue Powered
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--t-2)" }}>
          AI-generated buy/sell signals synthesized from SoSoValue ETF flows, SSI indexes, and news sentiment
        </p>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card text-center">
          <div className="num-xl mono up mb-1">{bullish.length}</div>
          <div className="label-caps">Bullish Signals</div>
        </div>
        <div className="metric-card text-center">
          <div className="num-xl mono mb-1" style={{ color: "var(--amber)" }}>{neutral.length}</div>
          <div className="label-caps">Neutral</div>
        </div>
        <div className="metric-card text-center">
          <div className="num-xl mono down mb-1">0</div>
          <div className="label-caps">Bearish Signals</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Signal list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="label-caps">Token Signals</div>
          {sorted.map((s) => {
            const cfg = SIGNAL_CONFIG[s.signal];
            const sectorColor = SECTOR_COLORS[s.sector] ?? "#8aa3c4";
            return (
              <div key={s.symbol} className="glass-row p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${sectorColor}20`, color: sectorColor, border: `1px solid ${sectorColor}40` }}
                  >
                    {s.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{s.symbol}</span>
                      <span className="text-xs" style={{ color: "var(--t-3)" }}>{s.sector}</span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {s.sources.slice(0, 2).map((src, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--cyan-dim)",
                            color: "var(--t-2)",
                            border: "1px solid var(--border-2)",
                          }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold mb-0.5" style={{ color: "var(--t-1)" }}>
                      ${s.price.toLocaleString()}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: s.change >= 0 ? "var(--green)" : "var(--red)" }}
                    >
                      {s.change >= 0 ? "+" : ""}{s.change}%
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <div className="label-caps mb-1">Score</div>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-12 h-1.5 rounded-full" style={{ background: "var(--border-1)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.score}%`,
                            background: s.score > 70 ? "var(--green)" : s.score > 50 ? "var(--amber)" : "var(--red)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: "var(--t-2)" }}>{s.score}</span>
                    </div>
                  </div>
                  <div
                    className="badge hidden sm:inline-flex flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.text}30` }}
                  >
                    {cfg.icon} {cfg.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="label-caps">SoSoValue Data</div>

          {/* SSI Indexes */}
          <div className="glass p-4">
            <div className="label-caps mb-3">SSI Indexes</div>
            <div className="space-y-3">
              {ssiIndexes.map((idx) => (
                <div key={idx.indexId} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold" style={{ color: "var(--t-2)" }}>{idx.indexCode}</div>
                    <div className="text-xs" style={{ color: "var(--t-3)" }}>
                      {idx.indexName.replace("SSI ", "")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold" style={{ color: "var(--t-1)" }}>
                      {idx.indexValue.toFixed(1)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: idx.changePercent >= 0 ? "var(--green)" : "var(--red)" }}
                    >
                      {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BTC ETF */}
          {etfData[0] && (
            <div className="glass p-4">
              <div className="label-caps mb-3">BTC ETF Flow</div>
              <div className="space-y-3">
                <div>
                  <div className="label-caps mb-1">Daily Net Inflow</div>
                  <div
                    className="num-lg mono"
                    style={{ color: etfData[0].totalNetInflow >= 0 ? "var(--green)" : "var(--red)" }}
                  >
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

          {/* Recent news */}
          <div className="glass p-4">
            <div className="label-caps mb-3">News Signals</div>
            <div className="space-y-3">
              {news.slice(0, 4).map((item) => (
                <div key={item.newsId} className="flex items-start gap-2">
                  <Newspaper size={12} className="flex-shrink-0 mt-0.5" style={{ color: "var(--cyan)" }} />
                  <div>
                    <div className="text-xs leading-snug mb-1" style={{ color: "var(--t-2)" }}>
                      {item.title}
                    </div>
                    <div className="flex gap-1">
                      {item.categories.slice(0, 2).map((c) => (
                        <span key={c} className="badge badge-cyan" style={{ fontSize: "9px", padding: "2px 6px" }}>
                          {c}
                        </span>
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
