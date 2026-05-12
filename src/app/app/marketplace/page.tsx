import Link from "next/link";
import { Globe, TrendingUp, Users, Star, Zap, Filter } from "lucide-react";

const INDEXES = [
  { id: "1", name: "AI Infrastructure Alpha", creator: "Atlas AI", verified: true, thesis: "High-conviction AI compute and infrastructure tokens with positive ETF flow correlation and institutional momentum", perf7d: 14.2, perf30d: 38.7, aum: 2400000, subscribers: 312, riskLevel: "medium", sector: "AI", tokens: ["TAO", "RENDER", "FET", "WLD", "OCEAN"], createdAt: "2026-04-15" },
  { id: "2", name: "DeFi Blue Chips", creator: "defi_maxi", verified: false, thesis: "Battle-tested DeFi protocols with strong TVL, revenue, and institutional accumulation signals", perf7d: 8.7, perf30d: 22.4, aum: 890000, subscribers: 187, riskLevel: "medium", sector: "DeFi", tokens: ["AAVE", "UNI", "COMP", "MKR", "SNX"], createdAt: "2026-04-20" },
  { id: "3", name: "RWA Momentum Basket", creator: "RWAdesk", verified: true, thesis: "Real world asset tokenization protocols with active institutional partnerships and growing on-chain AUM", perf7d: 6.3, perf30d: 18.9, aum: 1100000, subscribers: 243, riskLevel: "low", sector: "RWA", tokens: ["LINK", "ONDO", "PENDLE", "TRU"], createdAt: "2026-04-18" },
  { id: "4", name: "Layer 2 Ecosystem", creator: "l2_maxi", verified: false, thesis: "Ethereum scaling solutions with high transaction volume and developer activity momentum", perf7d: 11.9, perf30d: 29.4, aum: 650000, subscribers: 98, riskLevel: "medium", sector: "Layer2", tokens: ["ARB", "OP", "MATIC", "MANTA", "ALT"], createdAt: "2026-04-22" },
  { id: "5", name: "Privacy Tech Revival", creator: "privacymaxi", verified: false, thesis: "Zero-knowledge and privacy-preserving protocols with growing regulatory tailwinds and developer interest", perf7d: -2.1, perf30d: 5.3, aum: 320000, subscribers: 67, riskLevel: "high", sector: "Privacy", tokens: ["MANTA", "BLUR", "SEI"], createdAt: "2026-04-28" },
  { id: "6", name: "BTC Ecosystem Plays", creator: "Atlas AI", verified: true, thesis: "Tokens with strong BTC ETF inflow correlation and infrastructure role in the Bitcoin ecosystem", perf7d: 9.4, perf30d: 25.1, aum: 3100000, subscribers: 421, riskLevel: "low", sector: "Layer1", tokens: ["STX", "LINK", "PYTH", "JTO"], createdAt: "2026-04-10" },
  { id: "7", name: "Perp DEX Leaders", creator: "dex_quant", verified: false, thesis: "Perpetual futures DEX protocols with strong volume growth and SoDEX ecosystem integration", perf7d: 16.8, perf30d: 44.2, aum: 780000, subscribers: 156, riskLevel: "high", sector: "DeFi", tokens: ["GMX", "DYDX", "INJ", "JTO"], createdAt: "2026-04-25" },
  { id: "8", name: "Cosmos Ecosystem Alpha", creator: "cosmaxi", verified: false, thesis: "Cosmos IBC ecosystem tokens with strong cross-chain activity and upcoming catalysts", perf7d: 4.1, perf30d: 12.7, aum: 240000, subscribers: 44, riskLevel: "medium", sector: "Infrastructure", tokens: ["ATOM", "TIA", "INJ", "NEAR"], createdAt: "2026-05-01" },
  { id: "9", name: "Liquid Staking Dominance", creator: "staking_desk", verified: true, thesis: "Liquid staking derivatives and restaking protocols positioned for ETH validator demand surge", perf7d: 7.2, perf30d: 19.8, aum: 1650000, subscribers: 289, riskLevel: "low", sector: "DeFi", tokens: ["LDO", "RPL", "PENDLE", "AAVE"], createdAt: "2026-04-12" },
];

const RISK_COLORS: Record<string, string> = {
  low: "#00e676", medium: "#00d9ff", high: "#d4a841", very_high: "#ff4444"
};
const SECTOR_COLORS: Record<string, string> = {
  DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4",
  AI: "#d4a841", RWA: "#00e676", Infrastructure: "#6366f1", Privacy: "#84cc16",
};

export default function MarketplacePage() {
  const sorted = [...INDEXES].sort((a, b) => b.perf7d - a.perf7d);
  const topPerformer = sorted[0];
  const totalAUM = INDEXES.reduce((s, i) => s + i.aum, 0);
  const totalSubs = INDEXES.reduce((s, i) => s + i.subscribers, 0);
  const bestReturn = Math.max(...INDEXES.map((i) => i.perf7d));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,168,65,0.12)", color: "var(--amber)" }}
            >
              <Globe size={18} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Index Marketplace</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--t-2)" }}>
            Browse, subscribe, and copy-execute top-performing thematic indexes
          </p>
        </div>
        <Link href="/app/builder" className="btn btn-cyan px-5 py-2.5 text-sm flex-shrink-0">
          + Publish Your Index
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Indexes", value: INDEXES.length.toString(), color: "var(--cyan)" },
          { label: "Combined AUM", value: `$${(totalAUM / 1e6).toFixed(1)}M`, color: "var(--green)" },
          { label: "Total Subscribers", value: totalSubs.toLocaleString(), color: "#a78bfa" },
          { label: "Best 7d Return", value: `+${bestReturn.toFixed(1)}%`, color: "var(--amber)" },
        ].map((s) => (
          <div key={s.label} className="metric-card text-center">
            <div className="num-xl mono mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="label-caps">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top performer spotlight */}
      <div className="border-gradient">
        <div className="glass relative overflow-hidden" style={{ padding: "24px" }}>
          <div className="absolute top-4 right-4">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: "var(--amber-dim)", border: "1px solid rgba(212,168,65,0.2)" }}
            >
              <Star size={11} style={{ color: "var(--amber)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--amber)" }}>Top Performer</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <div className="label-caps mb-2">Spotlight · This Week</div>
              <h2 className="text-xl font-black mb-1" style={{ color: "var(--t-1)" }}>{topPerformer.name}</h2>
              <p className="text-sm mb-4 leading-relaxed max-w-lg" style={{ color: "var(--t-2)" }}>
                {topPerformer.thesis}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {topPerformer.tokens.map((t) => (
                  <span key={t} className="badge badge-cyan">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 sm:gap-3 sm:text-right sm:min-w-[130px]">
              <div>
                <div className="label-caps mb-1">7d Return</div>
                <div className="num-xl mono up">+{topPerformer.perf7d}%</div>
              </div>
              <div>
                <div className="label-caps mb-1">30d Return</div>
                <div className="num-lg mono up">+{topPerformer.perf30d}%</div>
              </div>
              <div>
                <div className="label-caps mb-1">AUM</div>
                <div className="text-sm font-bold font-mono" style={{ color: "var(--t-2)" }}>
                  ${(topPerformer.aum / 1e6).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ color: "var(--t-3)" }}>
          <Filter size={13} />
          <span className="text-sm">Filter:</span>
        </div>
        {["All", "AI", "DeFi", "Layer2", "RWA", "Infrastructure", "Privacy"].map((f) => (
          <button
            key={f}
            className="badge cursor-pointer hover:opacity-90 transition-opacity"
            style={
              f === "All"
                ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid var(--border-2)" }
                : { background: "var(--bg-3)", color: "var(--t-3)", border: "1px solid var(--border-1)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Index grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {INDEXES.map((idx) => {
          const sectorColor = SECTOR_COLORS[idx.sector] ?? "#8aa3c4";
          const riskColor = RISK_COLORS[idx.riskLevel] ?? "var(--cyan)";
          return (
            <div key={idx.id} className="glass flex flex-col hover:scale-[1.015] transition-transform">
              <div style={{ padding: "20px 20px 0" }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${sectorColor}20`, color: sectorColor }}
                    >
                      {idx.sector.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold leading-tight" style={{ color: "var(--t-1)" }}>
                        {idx.name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--t-3)" }}>
                        by {idx.creator} {idx.verified ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--t-2)" }}>
                  {idx.thesis.length > 100 ? idx.thesis.slice(0, 100) + "…" : idx.thesis}
                </p>

                <div className="flex gap-1 flex-wrap mb-4">
                  {idx.tokens.map((t) => <span key={t} className="badge badge-cyan">{t}</span>)}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center glass-inset py-2">
                    <div className="label-caps mb-0.5">7d</div>
                    <div
                      className="text-base font-black font-mono"
                      style={{ color: idx.perf7d >= 0 ? "var(--green)" : "var(--red)" }}
                    >
                      {idx.perf7d >= 0 ? "+" : ""}{idx.perf7d}%
                    </div>
                  </div>
                  <div className="text-center glass-inset py-2">
                    <div className="label-caps mb-0.5">AUM</div>
                    <div className="text-sm font-bold font-mono" style={{ color: "var(--t-2)" }}>
                      ${idx.aum >= 1e6 ? `${(idx.aum / 1e6).toFixed(1)}M` : `${(idx.aum / 1e3).toFixed(0)}K`}
                    </div>
                  </div>
                  <div className="text-center glass-inset py-2">
                    <div className="label-caps mb-0.5">Subs</div>
                    <div className="text-sm font-bold" style={{ color: "var(--t-2)" }}>
                      <Users size={10} className="inline mr-0.5" />{idx.subscribers}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-5 py-3 mt-auto"
                style={{ borderTop: "1px solid var(--border-1)" }}
              >
                <span
                  className="badge"
                  style={{
                    background: `${riskColor}15`,
                    color: riskColor,
                    border: `1px solid ${riskColor}30`,
                  }}
                >
                  {idx.riskLevel}
                </span>
                <button className="btn btn-cyan px-4 py-1.5 text-xs">
                  <Zap size={11} /> Copy Execute
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
