"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, Users, Star, Zap, Filter, PlusCircle, Loader2, ShieldCheck } from "lucide-react";
import type { StoredIndex } from "@/lib/store";
import type { SSIIndex } from "@/lib/sosovalue";

const SECTOR_FROM_TICKER: Record<string, string> = {
  ssiDeFi: "DeFi", ssiAI: "AI", ssiLayer1: "Layer1", ssiLayer2: "Layer2", ssiRWA: "RWA",
};

const RISK_FROM_TICKER: Record<string, string> = {
  ssiDeFi: "medium", ssiAI: "high", ssiLayer1: "low", ssiLayer2: "medium", ssiRWA: "low",
};

const RISK_COLORS: Record<string, string> = {
  low: "#00e676", medium: "#00d9ff", high: "#d4a841", very_high: "#ff4444",
};
const SECTOR_COLORS: Record<string, string> = {
  DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4",
  AI: "#d4a841", RWA: "#00e676", Infrastructure: "#6366f1", Privacy: "#84cc16",
};

const FILTERS = ["All", "AI", "DeFi", "Layer1", "Layer2", "RWA"];

export default function MarketplacePage() {
  const [ssiIndexes, setSsiIndexes]         = useState<SSIIndex[]>([]);
  const [publishedIndexes, setPublishedIndexes] = useState<StoredIndex[]>([]);
  const [loadingSsi, setLoadingSsi]         = useState(true);
  const [loadingPub, setLoadingPub]         = useState(true);
  const [activeFilter, setActiveFilter]     = useState("All");

  useEffect(() => {
    fetch("/api/ssi-indexes")
      .then((r) => r.json())
      .then((d) => setSsiIndexes(d.indexes ?? []))
      .catch(() => {})
      .finally(() => setLoadingSsi(false));

    fetch("/api/published-indexes")
      .then((r) => r.json())
      .then((d) => setPublishedIndexes(d.indexes ?? []))
      .catch(() => {})
      .finally(() => setLoadingPub(false));
  }, []);

  const filteredSSI = activeFilter === "All"
    ? ssiIndexes
    : ssiIndexes.filter((i) => SECTOR_FROM_TICKER[i.indexCode] === activeFilter);

  const topPerformer = [...ssiIndexes].sort((a, b) => b.perf7d - a.perf7d)[0];

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
            {!loadingSsi && (
              <span className="badge badge-green">
                <span className="live-dot" style={{ width: 5, height: 5 }} /> Live
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "var(--t-2)" }}>
            Real-time SoSoValue SSI indexes and community-built baskets
          </p>
        </div>
        <Link href="/app/builder" className="btn btn-cyan px-5 py-2.5 text-sm flex-shrink-0">
          <PlusCircle size={15} /> Build & Publish Index
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "SSI Indexes",   value: loadingSsi ? "…" : String(ssiIndexes.length),                                                        color: "var(--cyan)"  },
          { label: "Community",     value: loadingPub ? "…" : String(publishedIndexes.length),                                                   color: "#a78bfa"      },
          { label: "Best 7d",       value: loadingSsi || !topPerformer ? "…" : `${topPerformer.perf7d >= 0 ? "+" : ""}${topPerformer.perf7d.toFixed(1)}%`, color: topPerformer?.perf7d >= 0 ? "var(--green)" : "var(--red)" },
          { label: "Data Source",   value: "SoSoValue",                                                                                          color: "var(--amber)" },
        ].map((s) => (
          <div key={s.label} className="metric-card text-center">
            <div className="num-xl mono mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="label-caps">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Spotlight — top SSI performer */}
      {!loadingSsi && topPerformer && (
        <div className="border-gradient">
          <div className="glass relative overflow-hidden" style={{ padding: "24px" }}>
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: "var(--amber-dim)", border: "1px solid rgba(212,168,65,0.2)" }}>
                <Star size={11} style={{ color: "var(--amber)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--amber)" }}>Top 7d Performer</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1">
                <div className="label-caps mb-2">SoSoValue SSI · Spotlight</div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--t-1)" }}>{topPerformer.indexName}</h2>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {topPerformer.tokens.slice(0, 6).map((t) => (
                    <span key={t} className="badge badge-cyan">{t}</span>
                  ))}
                  {topPerformer.tokens.length > 6 && (
                    <span className="badge" style={{ color: "var(--t-3)" }}>+{topPerformer.tokens.length - 6} more</span>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col gap-4 sm:gap-3 sm:text-right sm:min-w-[130px]">
                <div>
                  <div className="label-caps mb-1">7d Return</div>
                  <div className={`num-xl mono ${topPerformer.perf7d >= 0 ? "up" : "down"}`}>
                    {topPerformer.perf7d >= 0 ? "+" : ""}{topPerformer.perf7d.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="label-caps mb-1">30d Return</div>
                  <div className={`num-lg mono ${topPerformer.perf30d >= 0 ? "up" : "down"}`}>
                    {topPerformer.perf30d >= 0 ? "+" : ""}{topPerformer.perf30d.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="label-caps mb-1">Index Price</div>
                  <div className="text-sm font-bold font-mono" style={{ color: "var(--t-2)" }}>
                    ${topPerformer.indexValue.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ color: "var(--t-3)" }}>
          <Filter size={13} />
          <span className="text-sm">Filter:</span>
        </div>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="badge cursor-pointer transition-opacity hover:opacity-90"
            style={f === activeFilter
              ? { background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid var(--border-2)" }
              : { background: "var(--bg-3)", color: "var(--t-3)", border: "1px solid var(--border-1)" }}>
            {f}
          </button>
        ))}
      </div>

      {/* SSI Index grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="label-caps">SoSoValue SSI Indexes</div>
          <span className="badge badge-green">Live</span>
        </div>
        {loadingSsi ? (
          <div className="glass text-center py-12">
            <Loader2 size={22} className="spin-ring mx-auto mb-2" style={{ color: "var(--cyan)" }} />
            <div className="text-sm" style={{ color: "var(--t-3)" }}>Fetching live SSI data…</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSSI.map((idx) => <SSICard key={idx.indexId} idx={idx} />)}
          </div>
        )}
      </div>

      {/* Community published */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="label-caps">Community Published</div>
          {loadingPub
            ? <Loader2 size={13} className="spin-ring" style={{ color: "var(--t-3)" }} />
            : <span className="badge badge-violet">{publishedIndexes.length} indexes</span>}
        </div>
        {!loadingPub && publishedIndexes.length === 0 ? (
          <div className="glass text-center py-10">
            <p className="text-sm mb-3" style={{ color: "var(--t-3)" }}>No community indexes yet.</p>
            <Link href="/app/builder" className="btn btn-cyan px-5 py-2 text-sm">
              Build & Publish the first one
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {publishedIndexes.map((idx) => <CommunityCard key={idx.id} idx={idx} />)}
          </div>
        )}
      </div>

    </div>
  );
}

function SSICard({ idx }: { idx: SSIIndex }) {
  const sector     = SECTOR_FROM_TICKER[idx.indexCode] ?? "Mixed";
  const risk       = RISK_FROM_TICKER[idx.indexCode]   ?? "medium";
  const sectorCol  = SECTOR_COLORS[sector]  ?? "#8aa3c4";
  const riskCol    = RISK_COLORS[risk]      ?? "var(--cyan)";

  return (
    <div className="glass flex flex-col hover:scale-[1.015] transition-transform">
      <div style={{ padding: "20px 20px 0" }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${sectorCol}20`, color: sectorCol }}>
              {sector.slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold leading-tight" style={{ color: "var(--t-1)" }}>
                {idx.indexName}
              </div>
              <div className="text-xs" style={{ color: "var(--t-3)" }}>SoSoValue · {sector}</div>
            </div>
          </div>
          <span className="badge badge-green" style={{ fontSize: "9px" }}>Live</span>
        </div>

        <div className="flex gap-1 flex-wrap mb-4">
          {idx.tokens.length > 0
            ? idx.tokens.slice(0, 5).map((t) => <span key={t} className="badge badge-cyan">{t}</span>)
            : <span className="text-xs" style={{ color: "var(--t-3)" }}>Constituents loading…</span>}
          {idx.tokens.length > 5 && (
            <span className="badge" style={{ color: "var(--t-3)" }}>+{idx.tokens.length - 5}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center glass-inset py-2">
            <div className="label-caps mb-0.5">24h</div>
            <div className="text-sm font-black font-mono"
              style={{ color: idx.changePercent >= 0 ? "var(--green)" : "var(--red)" }}>
              {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
            </div>
          </div>
          <div className="text-center glass-inset py-2">
            <div className="label-caps mb-0.5">7d</div>
            <div className="text-sm font-black font-mono"
              style={{ color: idx.perf7d >= 0 ? "var(--green)" : "var(--red)" }}>
              {idx.perf7d >= 0 ? "+" : ""}{idx.perf7d.toFixed(2)}%
            </div>
          </div>
          <div className="text-center glass-inset py-2">
            <div className="label-caps mb-0.5">30d</div>
            <div className="text-sm font-black font-mono"
              style={{ color: idx.perf30d >= 0 ? "var(--green)" : "var(--red)" }}>
              {idx.perf30d >= 0 ? "+" : ""}{idx.perf30d.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 mt-auto"
        style={{ borderTop: "1px solid var(--border-1)" }}>
        <div>
          <span className="badge"
            style={{ background: `${riskCol}15`, color: riskCol, border: `1px solid ${riskCol}30` }}>
            {risk}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: "var(--t-3)" }}>
            ${idx.indexValue.toFixed(4)}
          </span>
          <button className="btn btn-cyan px-4 py-1.5 text-xs">
            <Zap size={11} /> Copy Execute
          </button>
        </div>
      </div>
    </div>
  );
}

function RigorBadge({ score }: { score: number }) {
  const color = score >= 80 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--red)";
  return (
    <span className="badge flex-shrink-0" style={{ background: `${color}1a`, color, border: `1px solid ${color}40`, fontSize: "9px" }}>
      Rigor {score}
    </span>
  );
}

function CommunityCard({ idx }: { idx: StoredIndex }) {
  const sectorCol = SECTOR_COLORS[idx.sector] ?? "#8aa3c4";
  const riskCol   = RISK_COLORS[idx.riskLevel] ?? "var(--cyan)";

  return (
    <div className="glass flex flex-col hover:scale-[1.015] transition-transform"
      style={{ border: "1px solid rgba(167,139,250,0.15)" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${sectorCol}20`, color: sectorCol }}>
              {(idx.sector ?? "?").slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold leading-tight" style={{ color: "var(--t-1)" }}>{idx.name}</div>
              <div className="text-xs" style={{ color: "var(--t-3)" }}>by {idx.creator}</div>
            </div>
          </div>
          <span className="badge badge-violet" style={{ fontSize: "9px" }}>Community</span>
        </div>

        <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--t-2)" }}>
          {(idx.thesis ?? idx.description ?? "").slice(0, 100)}
          {(idx.thesis ?? idx.description ?? "").length > 100 ? "…" : ""}
        </p>

        <div className="flex gap-1 flex-wrap mb-4">
          {(idx.tokens ?? []).map((t) => <span key={t} className="badge badge-cyan">{t}</span>)}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center glass-inset py-2">
            <div className="label-caps mb-0.5">7d</div>
            {idx.perf7d === null ? (
              <div className="text-xs font-medium" style={{ color: "var(--t-3)" }}>Pending T+7d</div>
            ) : (
              <div className="text-base font-black font-mono"
                style={{ color: idx.perf7d >= 0 ? "var(--green)" : "var(--red)" }}>
                {idx.perf7d >= 0 ? "+" : ""}{idx.perf7d.toFixed(1)}%
              </div>
            )}
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

        <Link href={`/app/ledger/${idx.thesisId}`}
          className="flex items-center gap-2 text-xs mb-4 hover:opacity-80"
          style={{ color: "var(--t-3)" }}>
          <ShieldCheck size={11} />
          <span className="font-mono truncate flex-1">{idx.canonicalHash.slice(0, 18)}…</span>
          {idx.verification.status === "completed" && idx.verification.score !== null && (
            <RigorBadge score={idx.verification.score} />
          )}
          <span style={{ color: "var(--cyan)" }}>View Ledger →</span>
        </Link>
      </div>

      <div className="flex items-center justify-between px-5 py-3 mt-auto"
        style={{ borderTop: "1px solid var(--border-1)" }}>
        <span className="badge"
          style={{ background: `${riskCol}15`, color: riskCol, border: `1px solid ${riskCol}30` }}>
          {idx.riskLevel}
        </span>
        <button className="btn btn-cyan px-4 py-1.5 text-xs">
          <Zap size={11} /> Copy Execute
        </button>
      </div>
    </div>
  );
}
