"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, TrendingUp, Users, Star, Zap, Filter, PlusCircle, Loader2 } from "lucide-react";
import type { StoredIndex } from "@/lib/store";

const CURATED: StoredIndex[] = [
  { id: "c1", name: "AI Infrastructure Alpha", creator: "Atlas AI", description: "High-conviction AI compute tokens", thesis: "AI compute and infrastructure tokens with positive ETF flow correlation and institutional momentum", perf7d: 14.2, perf30d: 38.7, aum: 2400000, subscribers: 312, riskLevel: "medium", sector: "AI", tokens: ["TAO", "RENDER", "FET", "WLD", "OCEAN"], publishedAt: Date.now(), aiConfidence: 87 },
  { id: "c2", name: "DeFi Blue Chips", creator: "defi_maxi", description: "Battle-tested DeFi protocols", thesis: "Battle-tested DeFi protocols with strong TVL, revenue, and institutional accumulation signals", perf7d: 8.7, perf30d: 22.4, aum: 890000, subscribers: 187, riskLevel: "medium", sector: "DeFi", tokens: ["AAVE", "UNI", "COMP", "MKR", "SNX"], publishedAt: Date.now(), aiConfidence: 73 },
  { id: "c3", name: "RWA Momentum Basket", creator: "RWAdesk", description: "Real world asset tokenization", thesis: "Real world asset tokenization protocols with active institutional partnerships and growing on-chain AUM", perf7d: 6.3, perf30d: 18.9, aum: 1100000, subscribers: 243, riskLevel: "low", sector: "RWA", tokens: ["LINK", "PENDLE", "TRU"], publishedAt: Date.now(), aiConfidence: 79 },
  { id: "c4", name: "Layer 2 Ecosystem", creator: "l2_maxi", description: "Ethereum scaling solutions", thesis: "Ethereum scaling solutions with high transaction volume and developer activity momentum", perf7d: 11.9, perf30d: 29.4, aum: 650000, subscribers: 98, riskLevel: "medium", sector: "Layer2", tokens: ["ARB", "OP", "MATIC", "MANTA", "ALT"], publishedAt: Date.now(), aiConfidence: 71 },
  { id: "c5", name: "Privacy Tech Revival", creator: "privacymaxi", description: "Privacy-preserving protocols", thesis: "Zero-knowledge and privacy-preserving protocols with growing regulatory tailwinds and developer interest", perf7d: -2.1, perf30d: 5.3, aum: 320000, subscribers: 67, riskLevel: "high", sector: "Privacy", tokens: ["MANTA", "BLUR", "SEI"], publishedAt: Date.now(), aiConfidence: 58 },
  { id: "c6", name: "BTC Ecosystem Plays", creator: "Atlas AI", description: "BTC correlation infrastructure", thesis: "Tokens with strong BTC ETF inflow correlation and infrastructure role in the Bitcoin ecosystem", perf7d: 9.4, perf30d: 25.1, aum: 3100000, subscribers: 421, riskLevel: "low", sector: "Layer1", tokens: ["STX", "LINK", "PYTH", "JTO"], publishedAt: Date.now(), aiConfidence: 82 },
  { id: "c7", name: "Perp DEX Leaders", creator: "dex_quant", description: "Perpetual futures DEX protocols", thesis: "Perpetual futures DEX protocols with strong volume growth and SoDEX ecosystem integration", perf7d: 16.8, perf30d: 44.2, aum: 780000, subscribers: 156, riskLevel: "high", sector: "DeFi", tokens: ["GMX", "DYDX", "INJ", "JTO"], publishedAt: Date.now(), aiConfidence: 65 },
  { id: "c8", name: "Liquid Staking Dominance", creator: "staking_desk", description: "Liquid staking derivatives", thesis: "Liquid staking derivatives and restaking protocols positioned for ETH validator demand surge", perf7d: 7.2, perf30d: 19.8, aum: 1650000, subscribers: 289, riskLevel: "low", sector: "DeFi", tokens: ["LDO", "RPL", "PENDLE", "AAVE"], publishedAt: Date.now(), aiConfidence: 76 },
];

const RISK_COLORS: Record<string, string> = {
  low: "#00e676", medium: "#00d9ff", high: "#d4a841", very_high: "#ff4444"
};
const SECTOR_COLORS: Record<string, string> = {
  DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4",
  AI: "#d4a841", RWA: "#00e676", Infrastructure: "#6366f1", Privacy: "#84cc16",
};

const FILTERS = ["All", "AI", "DeFi", "Layer1", "Layer2", "RWA", "Infrastructure", "Privacy"];

export default function MarketplacePage() {
  const [publishedIndexes, setPublishedIndexes] = useState<StoredIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetch("/api/published-indexes")
      .then((r) => r.json())
      .then((data) => setPublishedIndexes(data.indexes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allIndexes = [...CURATED];
  const filtered = activeFilter === "All"
    ? allIndexes
    : allIndexes.filter((i) => i.sector === activeFilter || (i.tokens ?? []).includes(activeFilter));

  const sorted = [...filtered].sort((a, b) => b.perf7d - a.perf7d);
  const topPerformer = CURATED.sort((a, b) => b.perf7d - a.perf7d)[0];
  const totalAUM = CURATED.reduce((s, i) => s + i.aum, 0);
  const totalSubs = CURATED.reduce((s, i) => s + i.subscribers, 0);
  const bestReturn = Math.max(...CURATED.map((i) => i.perf7d));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,168,65,0.12)", color: "var(--amber)" }}>
              <Globe size={18} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Index Marketplace</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--t-2)" }}>
            Browse, subscribe, and copy-execute top-performing thematic indexes
          </p>
        </div>
        <Link href="/app/builder" className="btn btn-cyan px-5 py-2.5 text-sm flex-shrink-0">
          <PlusCircle size={15} /> Build & Publish Index
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Indexes",      value: (CURATED.length + publishedIndexes.length).toString(), color: "var(--cyan)"  },
          { label: "Combined AUM",       value: `$${(totalAUM / 1e6).toFixed(1)}M`,                   color: "var(--green)" },
          { label: "Total Subscribers",  value: totalSubs.toLocaleString(),                           color: "#a78bfa"      },
          { label: "Best 7d Return",     value: `+${bestReturn.toFixed(1)}%`,                         color: "var(--amber)" },
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
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: "var(--amber-dim)", border: "1px solid rgba(212,168,65,0.2)" }}>
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

      {/* User-published indexes section */}
      {(loading || publishedIndexes.length > 0) && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="label-caps">Your Published Indexes</div>
            {loading
              ? <Loader2 size={13} className="spin-ring" style={{ color: "var(--t-3)" }} />
              : <span className="badge badge-green">{publishedIndexes.length} live</span>}
          </div>
          {loading ? (
            <div className="glass text-center py-10" style={{ color: "var(--t-3)" }}>
              <Loader2 size={20} className="spin-ring mx-auto mb-2" />
              <div className="text-sm">Loading published indexes...</div>
            </div>
          ) : publishedIndexes.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {publishedIndexes.map((idx) => (
                <IndexCard key={idx.id} idx={idx} userPublished />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ color: "var(--t-3)" }}>
          <Filter size={13} />
          <span className="text-sm">Filter:</span>
        </div>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="badge cursor-pointer hover:opacity-90 transition-opacity"
            style={
              f === activeFilter
                ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid var(--border-2)" }
                : { background: "var(--bg-3)", color: "var(--t-3)", border: "1px solid var(--border-1)" }
            }>
            {f}
          </button>
        ))}
      </div>

      {/* Curated index grid */}
      <div>
        <div className="label-caps mb-4">Curated Indexes</div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sorted.map((idx) => <IndexCard key={idx.id} idx={idx} />)}
        </div>
      </div>
    </div>
  );
}

function IndexCard({ idx, userPublished = false }: { idx: StoredIndex; userPublished?: boolean }) {
  const sectorColor = SECTOR_COLORS[idx.sector] ?? "#8aa3c4";
  const riskColor   = RISK_COLORS[idx.riskLevel] ?? "var(--cyan)";

  return (
    <div className="glass flex flex-col hover:scale-[1.015] transition-transform"
      style={userPublished ? { border: "1px solid rgba(0,230,118,0.2)" } : undefined}>
      <div style={{ padding: "20px 20px 0" }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${sectorColor}20`, color: sectorColor }}>
              {(idx.sector ?? "?").slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold leading-tight" style={{ color: "var(--t-1)" }}>
                {idx.name}
              </div>
              <div className="text-xs" style={{ color: "var(--t-3)" }}>
                by {idx.creator}
                {userPublished && <span style={{ color: "var(--green)" }}> · you</span>}
              </div>
            </div>
          </div>
          {userPublished && (
            <span className="badge badge-green" style={{ fontSize: "9px" }}>Published</span>
          )}
        </div>

        <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--t-2)" }}>
          {(idx.thesis ?? idx.description ?? "").length > 100
            ? (idx.thesis ?? idx.description ?? "").slice(0, 100) + "…"
            : (idx.thesis ?? idx.description ?? "")}
        </p>

        <div className="flex gap-1 flex-wrap mb-4">
          {(idx.tokens ?? []).map((t) => <span key={t} className="badge badge-cyan">{t}</span>)}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center glass-inset py-2">
            <div className="label-caps mb-0.5">7d</div>
            <div className="text-base font-black font-mono"
              style={{ color: idx.perf7d >= 0 ? "var(--green)" : "var(--red)" }}>
              {idx.perf7d >= 0 ? "+" : ""}{idx.perf7d.toFixed(1)}%
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

      <div className="flex items-center justify-between px-5 py-3 mt-auto"
        style={{ borderTop: "1px solid var(--border-1)" }}>
        <span className="badge"
          style={{ background: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30` }}>
          {idx.riskLevel}
        </span>
        <button className="btn btn-cyan px-4 py-1.5 text-xs">
          <Zap size={11} /> Copy Execute
        </button>
      </div>
    </div>
  );
}
