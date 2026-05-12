import Link from "next/link";
import { getNewsList, getBTCETFSummary, getSSIIndexes } from "@/lib/sosovalue";
import { formatPercent } from "@/lib/utils";
import {
  Brain, ArrowRight, TrendingUp, TrendingDown,
  Newspaper, BarChart3, Zap, Clock
} from "lucide-react";

export const revalidate = 120;

export default async function DashboardPage() {
  const [news, etfData, ssiIndexes] = await Promise.all([
    getNewsList(undefined, 8),
    getBTCETFSummary(),
    getSSIIndexes(),
  ]);

  const latest = etfData[0];
  const prev = etfData[1];
  const etfFlowChange = latest && prev
    ? ((latest.totalNetInflow - prev.totalNetInflow) / Math.abs(prev.totalNetInflow || 1)) * 100
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="border-gradient">
        <div className="glass relative overflow-hidden" style={{ padding: "24px" }}>
          <div
            className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.03))" }}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black mb-1" style={{ color: "var(--t-1)" }}>
                Welcome to ATLAS
              </h1>
              <p className="text-sm" style={{ color: "var(--t-2)" }}>
                Build thematic on-chain indexes powered by SoSoValue institutional data
              </p>
            </div>
            <Link href="/app/builder" className="btn btn-cyan px-5 py-2.5 text-sm flex-shrink-0">
              <Brain size={16} />
              Build New Index
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div>
        <div className="label-caps mb-4">Live Market Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "BTC ETF Net Inflow",
              value: latest ? `$${(latest.totalNetInflow / 1e6).toFixed(0)}M` : "—",
              sub: etfFlowChange !== 0
                ? `${etfFlowChange >= 0 ? "+" : ""}${etfFlowChange.toFixed(1)}% vs yesterday`
                : "",
              positive: etfFlowChange >= 0,
              negative: etfFlowChange < 0,
            },
            {
              label: "BTC ETF Total AUM",
              value: latest ? `$${(latest.totalNetAssets / 1e9).toFixed(1)}B` : "—",
              sub: `${latest?.btcHolding?.toLocaleString() ?? "—"} BTC held`,
              positive: true,
              negative: false,
            },
            {
              label: "SSI DeFi Index",
              value: ssiIndexes[0] ? ssiIndexes[0].indexValue.toFixed(1) : "—",
              sub: ssiIndexes[0] ? formatPercent(ssiIndexes[0].changePercent) : "",
              positive: (ssiIndexes[0]?.changePercent ?? 0) >= 0,
              negative: (ssiIndexes[0]?.changePercent ?? 0) < 0,
            },
            {
              label: "SSI AI Index",
              value: ssiIndexes[3] ? ssiIndexes[3].indexValue.toFixed(1) : "—",
              sub: ssiIndexes[3] ? formatPercent(ssiIndexes[3].changePercent) : "",
              positive: (ssiIndexes[3]?.changePercent ?? 0) >= 0,
              negative: (ssiIndexes[3]?.changePercent ?? 0) < 0,
            },
          ].map((m, i) => (
            <div key={i} className="metric-card">
              <div className="label-caps mb-3">{m.label}</div>
              <div className="num-xl mono mb-1" style={{ color: "var(--t-1)" }}>{m.value}</div>
              {m.sub && (
                <div
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: m.positive ? "var(--green)" : m.negative ? "var(--red)" : "var(--t-2)" }}
                >
                  {m.positive ? <TrendingUp size={10} /> : m.negative ? <TrendingDown size={10} /> : null}
                  {m.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SSI Indexes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="label-caps">SoSoValue SSI Indexes</div>
          <span className="badge badge-green">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            Live
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ssiIndexes.map((idx) => (
            <div key={idx.indexId} className="glass-row p-4 hover:scale-[1.02] transition-transform cursor-default">
              <div className="text-xs font-bold mb-2" style={{ color: "var(--t-2)" }}>{idx.indexCode}</div>
              <div className="num-lg mono mb-1" style={{ color: "var(--t-1)" }}>
                {idx.indexValue.toFixed(1)}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: idx.changePercent >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {idx.changePercent >= 0 ? "▲" : "▼"} {Math.abs(idx.changePercent).toFixed(2)}%
              </div>
              <div className="text-xs mt-1 truncate" style={{ color: "var(--t-3)" }}>
                {idx.indexName.replace("SSI ", "")}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ETF Flow Chart */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="label-caps">BTC ETF Daily Net Flow (30d)</div>
            <span className="badge badge-cyan">SoSoValue Data</span>
          </div>
          <div className="glass p-5">
            <ETFFlowBars data={etfData.slice(0, 14).reverse()} />
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div className="label-caps mb-4">Quick Actions</div>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} href={a.href}>
                <div className="glass-row p-4 flex items-center gap-3 cursor-pointer group">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}18`, color: a.color }}
                  >
                    <a.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: "var(--t-1)" }}>{a.title}</div>
                    <div className="text-xs truncate" style={{ color: "var(--t-3)" }}>{a.desc}</div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--cyan)" }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* News feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="label-caps">SoSoValue News Feed</div>
          <span className="badge badge-violet">Real-Time</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {news.map((item) => (
            <a key={item.newsId} href={item.url === "#" ? undefined : item.url} target="_blank" rel="noreferrer">
              <div className="glass-row p-4 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}
                  >
                    <Newspaper size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-1 leading-snug" style={{ color: "var(--t-1)" }}>
                      {item.title}
                    </div>
                    <div className="text-xs leading-relaxed mb-2" style={{ color: "var(--t-2)" }}>
                      {item.summary}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.categories.slice(0, 3).map((c) => (
                        <span key={c} className="badge badge-cyan">{c}</span>
                      ))}
                      <span className="text-xs flex items-center gap-1 ml-auto" style={{ color: "var(--t-3)" }}>
                        <Clock size={10} />
                        {Math.round((Date.now() - item.publishTime) / 3600000)}h ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function ETFFlowBars({ data }: { data: { date: string; totalNetInflow: number }[] }) {
  const max = Math.max(...data.map((d) => Math.abs(d.totalNetInflow)));
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = max > 0 ? (Math.abs(d.totalNetInflow) / max) * 100 : 0;
        const positive = d.totalNetInflow >= 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="text-xs w-20 flex-shrink-0 font-mono text-right" style={{ color: "var(--t-3)" }}>
              {d.date.slice(5)}
            </div>
            <div className="flex-1 h-5 relative rounded-sm overflow-hidden" style={{ background: "var(--bg-2)" }}>
              <div
                className="absolute top-0 bottom-0 rounded-sm transition-all"
                style={{
                  width: `${pct}%`,
                  [positive ? "left" : "right"]: 0,
                  background: positive ? "rgba(0,230,118,0.4)" : "rgba(255,68,68,0.35)",
                }}
              />
            </div>
            <div
              className="text-xs w-20 font-mono text-right flex-shrink-0"
              style={{ color: positive ? "var(--green)" : "var(--red)" }}
            >
              {positive ? "+" : ""}{(d.totalNetInflow / 1e6).toFixed(0)}M
            </div>
          </div>
        );
      })}
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/app/builder",
    title: "Build New Index",
    desc: "Describe a thesis and let AI construct your basket",
    icon: Brain,
    color: "#7c3aed",
  },
  {
    href: "/app/marketplace",
    title: "Browse Marketplace",
    desc: "Copy top-performing indexes from other builders",
    icon: BarChart3,
    color: "#00d9ff",
  },
  {
    href: "/app/signals",
    title: "View Signals",
    desc: "Live buy/sell signals from SoSoValue data",
    icon: Zap,
    color: "#00e676",
  },
];
