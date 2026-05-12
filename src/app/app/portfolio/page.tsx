import Link from "next/link";
import { BarChart3, TrendingUp, TrendingDown, RefreshCw, Brain, Zap } from "lucide-react";
import { formatPercent } from "@/lib/utils";

const PORTFOLIOS = [
  {
    id: "p1", indexName: "AI Infrastructure Alpha", allocatedUSD: 1000, currentValue: 1142, pnl: 142, pnlPercent: 14.2,
    createdAt: "2026-04-28", lastRebalanced: "2026-05-08",
    tokens: [
      { symbol: "TAO", allocUSD: 220, currentValue: 261, pnl: 41, pnlPct: 18.6, weight: 22, price: 485 },
      { symbol: "RENDER", allocUSD: 180, currentValue: 202, pnl: 22, pnlPct: 12.1, weight: 18, price: 8.9 },
      { symbol: "FET", allocUSD: 150, currentValue: 165, pnl: 15, pnlPct: 9.7, weight: 15, price: 2.8 },
      { symbol: "WLD", allocUSD: 130, currentValue: 139, pnl: 9, pnlPct: 6.8, weight: 13, price: 3.1 },
      { symbol: "OCEAN", allocUSD: 120, currentValue: 125, pnl: 5, pnlPct: 4.2, weight: 12, price: 1.45 },
      { symbol: "NEAR", allocUSD: 200, currentValue: 249, pnl: 49, pnlPct: 24.7, weight: 20, price: 7.8 },
    ],
    needsRebalance: false,
  },
  {
    id: "p2", indexName: "DeFi Blue Chips", allocatedUSD: 500, currentValue: 543, pnl: 43, pnlPercent: 8.7,
    createdAt: "2026-05-01", lastRebalanced: "2026-05-05",
    tokens: [
      { symbol: "AAVE", allocUSD: 150, currentValue: 164, pnl: 14, pnlPct: 9.3, weight: 30, price: 285 },
      { symbol: "UNI", allocUSD: 100, currentValue: 109, pnl: 9, pnlPct: 8.7, weight: 20, price: 11.2 },
      { symbol: "COMP", allocUSD: 100, currentValue: 107, pnl: 7, pnlPct: 7.1, weight: 20, price: 62 },
      { symbol: "MKR", allocUSD: 100, currentValue: 109, pnl: 9, pnlPct: 8.9, weight: 20, price: 1850 },
      { symbol: "SNX", allocUSD: 50, currentValue: 54, pnl: 4, pnlPct: 8.0, weight: 10, price: 2.1 },
    ],
    needsRebalance: true,
  },
];

export default function PortfolioPage() {
  const totalAllocated = PORTFOLIOS.reduce((s, p) => s + p.allocatedUSD, 0);
  const totalCurrent = PORTFOLIOS.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = totalCurrent - totalAllocated;
  const totalPnlPct = (totalPnl / totalAllocated) * 100;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}
            >
              <BarChart3 size={18} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>My Portfolio</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--t-2)" }}>
            Track and manage your on-chain index positions
          </p>
        </div>
        <Link href="/app/builder" className="btn btn-cyan px-4 py-2 text-sm">
          <Brain size={14} /> New Index
        </Link>
      </div>

      {/* Summary */}
      <div className="border-gradient">
        <div className="glass" style={{ padding: "24px" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="label-caps mb-2">Total Value</div>
              <div className="num-xl mono" style={{ color: "var(--t-1)" }}>
                ${totalCurrent.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="label-caps mb-2">Total P&L</div>
              <div className="num-xl mono" style={{ color: totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="label-caps mb-2">Return</div>
              <div className="num-xl mono" style={{ color: totalPnlPct >= 0 ? "var(--green)" : "var(--red)" }}>
                {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="label-caps mb-2">Indexes</div>
              <div className="num-xl mono" style={{ color: "var(--t-1)" }}>{PORTFOLIOS.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio cards */}
      {PORTFOLIOS.map((p) => (
        <div key={p.id} className="glass overflow-hidden">
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: "1px solid var(--border-1)" }}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold" style={{ color: "var(--t-1)" }}>{p.indexName}</h2>
                {p.needsRebalance && (
                  <span className="badge badge-amber">Rebalance Suggested</span>
                )}
              </div>
              <div className="text-xs" style={{ color: "var(--t-3)" }}>
                Created {p.createdAt} · Last rebalanced {p.lastRebalanced}
              </div>
            </div>
            <div className="text-right">
              <div className="num-lg mono" style={{ color: "var(--t-1)" }}>
                ${p.currentValue.toLocaleString()}
              </div>
              <div
                className="text-sm font-bold flex items-center justify-end gap-1"
                style={{ color: p.pnl >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {p.pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {p.pnl >= 0 ? "+" : ""}${p.pnl} ({formatPercent(p.pnlPercent)})
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {p.tokens.map((t) => (
              <div
                key={t.symbol}
                className="glass-row flex items-center gap-3 p-3"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}
                >
                  {t.symbol.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{t.symbol}</span>
                    <span className="text-xs" style={{ color: "var(--t-3)" }}>{t.weight}% weight</span>
                  </div>
                  <div className="flex-1 h-1 rounded-full mt-1.5" style={{ background: "var(--border-1)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${t.weight}%`, background: "rgba(0,217,255,0.4)" }}
                    />
                  </div>
                </div>
                <div className="text-right hidden sm:block w-20">
                  <div className="text-xs font-mono" style={{ color: "var(--t-2)" }}>
                    ${t.price.toLocaleString()}
                  </div>
                </div>
                <div className="text-right w-28">
                  <div className="text-sm font-bold font-mono" style={{ color: "var(--t-1)" }}>
                    ${t.currentValue}
                  </div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: t.pnl >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {t.pnl >= 0 ? "+" : ""}${t.pnl} ({formatPercent(t.pnlPct)})
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex gap-2 p-4"
            style={{ borderTop: "1px solid var(--border-0)" }}
          >
            {p.needsRebalance && (
              <button className="btn btn-cyan px-4 py-2 text-xs">
                <RefreshCw size={12} /> Rebalance via SoDEX
              </button>
            )}
            <button className="btn btn-outline px-4 py-2 text-xs">
              <Brain size={12} /> AI Analysis
            </button>
            <button className="btn btn-outline px-4 py-2 text-xs">
              <Zap size={12} /> Publish Index
            </button>
          </div>
        </div>
      ))}

      {PORTFOLIOS.length === 0 && (
        <div className="text-center py-20">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-20" style={{ color: "var(--cyan)" }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--t-1)" }}>No indexes yet</h3>
          <p className="text-sm mb-6" style={{ color: "var(--t-2)" }}>
            Build your first thematic index to get started
          </p>
          <Link href="/app/builder" className="btn btn-cyan px-6 py-2.5 text-sm">
            <Brain size={15} /> Build First Index
          </Link>
        </div>
      )}
    </div>
  );
}
