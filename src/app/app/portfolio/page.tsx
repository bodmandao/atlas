"use client";

import { useEffect, useState } from "react";
import { Wallet, ExternalLink, Copy, CheckCheck, TrendingUp } from "lucide-react";
import type { PortfolioPosition } from "@/lib/store";
import Link from "next/link";

function short(hash: string) {
  return hash.length > 12 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}

function timeSince(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const SECTOR_COLORS: Record<string, string> = {
  ssiAI: "#d4a841", ssiDeFi: "#8b5cf6", ssiLayer1: "#3b82f6",
  ssiLayer2: "#06b6d4", ssiRWA: "#00e676",
};
const SECTOR_DISPLAY: Record<string, string> = {
  ssiAI: "AI", ssiDeFi: "DeFi", ssiLayer1: "Layer1", ssiLayer2: "Layer2", ssiRWA: "RWA",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="icon-btn" title="Copy">
      {copied
        ? <CheckCheck size={12} style={{ color: "var(--green)" }} />
        : <Copy size={12} />}
    </button>
  );
}

function PositionCard({ pos }: { pos: PortfolioPosition }) {
  const sectorTotals: Record<string, number> = {};
  for (const t of pos.tokens) {
    sectorTotals[t.sector] = (sectorTotals[t.sector] ?? 0) + t.allocUSD;
  }

  return (
    <div className="glass p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: "var(--t-1)" }}>{pos.indexName}</span>
            {pos.live
              ? <span className="badge badge-green">
                  <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
                </span>
              : <span className="badge"
                  style={{ background: "var(--amber-dim)", color: "var(--amber)", border: "1px solid var(--amber-border)" }}>
                  SIM
                </span>
            }
          </div>
          <div className="text-xs" style={{ color: "var(--t-3)" }}>{timeSince(pos.createdAt)} · {pos.network}</div>
        </div>
        <div className="text-right">
          <div className="num-lg mono" style={{ color: "var(--t-1)" }}>
            ${pos.allocatedUSD.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "var(--t-3)" }}>Allocated</div>
        </div>
      </div>

      {/* Sector allocation bar */}
      <div>
        <div className="flex h-2 rounded-full overflow-hidden mb-2">
          {Object.entries(sectorTotals).map(([sector, usd]) => (
            <div
              key={sector}
              style={{
                width: `${(usd / pos.allocatedUSD) * 100}%`,
                background: SECTOR_COLORS[sector] ?? "#8aa3c4",
              }}
              title={`${SECTOR_DISPLAY[sector] ?? sector}: $${usd.toFixed(0)}`}
            />
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(sectorTotals).map(([sector, usd]) => (
            <span key={sector} className="text-xs" style={{ color: SECTOR_COLORS[sector] ?? "var(--t-3)" }}>
              {SECTOR_DISPLAY[sector] ?? sector} {((usd / pos.allocatedUSD) * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      </div>

      {/* Token fills */}
      <div>
        <div className="label-caps mb-2">Fills</div>
        <div className="space-y-1">
          {pos.tokens.map((t) => (
            <div key={t.symbol} className="glass-row px-3 py-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: `${SECTOR_COLORS[t.sector] ?? "#8aa3c4"}20`,
                    color: SECTOR_COLORS[t.sector] ?? "var(--t-2)",
                  }}
                >
                  {t.symbol.slice(0, 2)}
                </div>
                <span className="text-xs font-bold" style={{ color: "var(--t-1)" }}>{t.symbol}</span>
                <span className="text-xs" style={{ color: "var(--t-3)" }}>{t.weight}%</span>
                <div className="flex-1" />
                <span className="text-xs font-mono" style={{ color: "var(--t-2)" }}>
                  {t.filledQty.toFixed(4)} @ ${t.fillPrice.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-bold ml-2" style={{ color: "var(--t-1)" }}>
                  ${t.allocUSD.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tx hash row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--t-3)" }}>Tx:</span>
          <span className="text-xs font-mono" style={{ color: "var(--cyan)" }}>{short(pos.bundleTxHash)}</span>
          <CopyButton text={pos.bundleTxHash} />
        </div>
        {pos.live && (
          <a
            href={`https://testnet-explorer.sodex.dev/tx/${pos.bundleTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            title="View on SoDEX explorer"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<PortfolioPosition[] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((d) => setPositions(d.positions ?? []))
      .catch(() => { setFetchError(true); setPositions([]); });
  }, []);

  const totalUSD  = positions?.reduce((s, p) => s + p.allocatedUSD, 0) ?? 0;
  const liveCount = positions?.filter((p) => p.live).length  ?? 0;
  const simCount  = positions?.filter((p) => !p.live).length ?? 0;

  if (positions === null) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <span className="text-sm" style={{ color: "var(--t-3)" }}>Loading portfolio…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--violet-dim)", color: "var(--violet)" }}
          >
            <Wallet size={18} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Portfolio</h1>
          {positions.length > 0 && (
            <span className="badge badge-cyan">
              {positions.length} position{positions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: "var(--t-2)" }}>
          Indexes you have executed — fills and allocations from your SoDEX orders
        </p>
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl text-sm" style={{ background: "var(--red-dim)", color: "var(--red)" }}>
          Could not fetch portfolio. Data may not be available yet.
        </div>
      )}

      {/* Stats strip */}
      {positions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="metric-card text-center">
            <div className="num-xl mono mb-1" style={{ color: "var(--t-1)" }}>
              ${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="label-caps">Total Deployed</div>
          </div>
          <div className="metric-card text-center">
            <div className="num-xl mono up mb-1">{liveCount}</div>
            <div className="label-caps">Live Orders</div>
          </div>
          <div className="metric-card text-center">
            <div className="num-xl mono mb-1" style={{ color: "var(--amber)" }}>{simCount}</div>
            <div className="label-caps">Simulated</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {positions.length === 0 && !fetchError && (
        <div className="glass p-12 flex flex-col items-center gap-5 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}
          >
            <TrendingUp size={28} />
          </div>
          <div>
            <div className="text-lg font-bold mb-2" style={{ color: "var(--t-1)" }}>No positions yet</div>
            <div className="text-sm max-w-xs" style={{ color: "var(--t-2)" }}>
              Build and execute your first thematic index to see live fill data here.
            </div>
          </div>
          <Link href="/app/builder" className="btn-primary px-6">
            Build an Index
          </Link>
        </div>
      )}

      {/* Position cards */}
      {positions.length > 0 && (
        <div className="space-y-4">
          <div className="label-caps">Executed Positions</div>
          {positions.map((pos) => (
            <PositionCard key={pos.id} pos={pos} />
          ))}
        </div>
      )}
    </div>
  );
}
