"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, Zap, Globe, Brain, Shield, BarChart3,
  TrendingUp, Activity, Layers, ChevronRight
} from "lucide-react";

interface TickerItem { symbol: string; price: number; change: number; }
interface SSIIndex {
  indexId: string; indexName: string; indexCode: string;
  indexValue: number; changePercent: number;
  perf7d: number; perf30d: number;
  tokens: string[]; weights: number[]; description?: string;
}

const TICKER_FALLBACK: TickerItem[] = [
  { symbol: "SSI DeFi", price: 0, change: 0 },
  { symbol: "SSI AI",   price: 0, change: 0 },
  { symbol: "SSI L1",   price: 0, change: 0 },
  { symbol: "SSI L2",   price: 0, change: 0 },
  { symbol: "SSI RWA",  price: 0, change: 0 },
];

const SECTOR_TAGS: Record<string, string[]> = {
  ssiDeFi:   ["DeFi", "Institutional"],
  ssiAI:     ["AI", "Infrastructure"],
  ssiLayer1: ["Layer 1", "Smart Contracts"],
  ssiLayer2: ["Layer 2", "Scaling"],
  ssiRWA:    ["RWA", "Low Risk"],
};

export default function LandingPage() {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(TICKER_FALLBACK);
  const [ssiIndexes,  setSSIIndexes]  = useState<SSIIndex[]>([]);

  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.json())
      .then((d) => { if (d.items?.length) setTickerItems(d.items); })
      .catch(() => {});

    fetch("/api/ssi-indexes")
      .then((r) => r.json())
      .then((d) => { if (d.indexes?.length) setSSIIndexes(d.indexes); })
      .catch(() => {});
  }, []);

  const tickers = [...tickerItems, ...tickerItems];

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--bg-1)" }}>

      {/* ── Ambient background lighting ────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="orb orb-cyan w-[700px] h-[700px] -top-40 -left-40 opacity-40" />
        <div className="orb orb-violet w-[600px] h-[600px] top-1/2 -right-60 opacity-30" />
        <div className="orb orb-amber w-[400px] h-[400px] bottom-0 left-1/3 opacity-20" />
        {/* Fine dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
        }} />
      </div>

      {/* ── Ticker ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-2" style={{ zIndex: 10, borderBottom: "1px solid var(--border-0)", backgroundColor: "rgba(5,9,15,0.9)" }}>
        <div className="ticker-inner">
          {tickers.map((t, i) => {
            const up = t.change >= 0;
            const isEtf = t.symbol === "BTC ETF";
            return (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <span className="label-caps" style={{ color: "var(--t-3)" }}>{t.symbol}</span>
                <span className="mono text-xs font-semibold" style={{ color: "var(--t-1)" }}>
                  {isEtf ? `$${t.price.toFixed(2)}B` : t.price.toFixed(3)}
                </span>
                {t.change !== 0 && (
                  <span className="mono text-xs font-bold" style={{ color: up ? "var(--green)" : "var(--red)" }}>
                    {up ? "▲" : "▼"} {Math.abs(t.change).toFixed(2)}%
                  </span>
                )}
                <span style={{ color: "var(--border-1)", fontSize: 12 }}>│</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 flex items-center justify-between px-8 h-16" style={{
        zIndex: 50,
        background: "rgba(5,9,15,0.75)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--border-0)",
      }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" style={{ textDecoration: "none" }}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="absolute inset-0 rounded-lg" style={{
              background: "linear-gradient(135deg, var(--cyan), var(--violet))",
              opacity: 0.9,
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6L11 7.75V11.25L8 13L5 11.25V7.75L8 6Z" fill="white" opacity="0.6"/>
              </svg>
            </div>
          </div>
          <span className="text-sm font-black tracking-widest" style={{ color: "var(--t-1)", letterSpacing: "0.15em" }}>ATLAS</span>
        </Link>

        {/* Center links — Protocol/Indexes/Signals/Docs removed, they had no
            real destination (href="#"). Signals has a real page at
            /app/signals if this ever gets relinked. */}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
            background: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.15)",
          }}>
            <span className="live-dot" />
            <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>Live</span>
          </div>
          <Link href="/app" className="btn btn-outline px-4 py-1.5 text-xs">Dashboard</Link>
          <Link href="/app/builder" className="btn btn-cyan px-5 py-1.5 text-xs">
            Build Index <ArrowRight size={12} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-28 pb-24 max-w-6xl mx-auto text-center" style={{ zIndex: 1 }}>

        {/* Eyebrow */}
        <div className="fade-up flex items-center justify-center gap-2 mb-8">
          <div className="badge badge-cyan">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            SoSoValue × SoDEX
          </div>
        </div>

        {/* Headline */}
        <h1 className="fade-up-1 text-display mb-6">
          <span className="grad-cyan">On-Chain Indexes</span>
          <br />
          <span style={{ color: "var(--t-1)" }}>Built by AI.</span>
        </h1>

        <p className="fade-up-2 text-hero-sub max-w-xl mx-auto mb-10">
          Describe your thesis. ATLAS pulls institutional ETF flow data from SoSoValue,
          constructs an optimized basket with Claude AI, and executes it on SoDEX — in under 3 minutes.
        </p>

        {/* CTA row */}
        <div className="fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link href="/app/builder" className="btn btn-cyan px-8 py-3.5 text-sm">
            <Brain size={17} />
            Build Your Index
            <ArrowRight size={15} />
          </Link>
          <Link href="/app/marketplace" className="btn btn-outline px-8 py-3.5 text-sm">
            <Globe size={17} />
            Explore Indexes
          </Link>
        </div>

        {/* ── Hero terminal ──────────────────────────────────────────── */}
        <div className="fade-up max-w-3xl mx-auto">
          <div className="glow-border">
            <div className="glass noise relative rounded-[20px] overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border-0)" }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="live-dot" />
                  <span className="label-caps" style={{ color: "var(--t-3)" }}>atlas.finance / builder</span>
                </div>
                <div className="w-16" />
              </div>

              {/* Terminal content */}
              <div className="p-6 text-left space-y-5">
                {/* Thesis input */}
                <div>
                  <div className="label-caps mb-2" style={{ color: "var(--cyan)" }}>Investment Thesis</div>
                  <div className="field py-3 px-4 font-mono text-xs leading-relaxed" style={{ color: "var(--cyan)", fontSize: 13, cursor: "text" }}>
                    &ldquo;AI infrastructure tokens with strong institutional ETF inflows and positive momentum&rdquo;
                  </div>
                </div>

                {/* Processing */}
                <div className="flex items-center gap-3 py-2">
                  <div className="live-dot" />
                  <span className="text-xs font-medium" style={{ color: "var(--t-2)" }}>
                    Analyzing SoSoValue ETF flows · SSI indexes · 847 news signals...
                  </span>
                </div>

                {/* Token grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { sym:"TAO",  w:"22%", ret:"+18.4%", sig:"Strong Buy", col:"var(--amber)"  },
                    { sym:"RNDR", w:"18%", ret:"+12.1%", sig:"Buy",        col:"var(--cyan)"   },
                    { sym:"FET",  w:"15%", ret:"+9.7%",  sig:"Buy",        col:"var(--cyan)"   },
                  ].map((t) => (
                    <div key={t.sym} className="glass-inset p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mono"
                          style={{ background: `${t.col}15`, color: t.col, border: `1px solid ${t.col}30` }}>
                          {t.sym.slice(0,2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{t.sym}</div>
                        </div>
                      </div>
                      <div className="label-caps mb-1">Weight</div>
                      <div className="text-base font-bold mono" style={{ color: t.col }}>{t.w}</div>
                      <div className="text-xs font-semibold mt-1.5" style={{ color: "var(--green)" }}>{t.ret}</div>
                    </div>
                  ))}
                </div>

                {/* Execute bar */}
                <div className="flex items-center justify-between p-4 rounded-2xl" style={{
                  background: "rgba(0,230,118,0.05)",
                  border: "1px solid rgba(0,230,118,0.15)",
                }}>
                  <div className="flex items-center gap-3">
                    <Zap size={15} style={{ color: "var(--green)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>
                      Ready to execute · Est. +14.8% (30d) · 8 tokens · Low risk
                    </span>
                  </div>
                  <Link href="/app/builder" className="btn btn-cyan px-4 py-2 text-xs" style={{ fontSize: 11 }}>
                    Execute via SoDEX
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────── */}
      <section className="relative px-6 py-10 max-w-6xl mx-auto" style={{ zIndex: 1 }}>
        <div className="sep mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {[
            { v:"1,247",  u:"Indexes Built",    note:"↑ 43 today"     },
            { v:"$48.2M", u:"Total AUM",        note:"Across all indexes" },
            { v:"+14.7%", u:"Avg 30d Return",   note:"Top quartile"    },
            { v:"3,891",  u:"Active Builders",  note:"Global"          },
          ].map((s, i) => (
            <div key={i} className="metric-card text-center">
              <div className="num-xl mono mb-1 grad-cyan">{s.v}</div>
              <div className="label-caps mb-1">{s.u}</div>
              <div className="text-xs" style={{ color: "var(--t-3)" }}>{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="relative px-6 py-24 max-w-6xl mx-auto" style={{ zIndex: 1 }}>
        <div className="text-center mb-16">
          <div className="badge badge-violet mb-4">Protocol Capabilities</div>
          <h2 className="text-4xl font-black tracking-tight mb-3" style={{ color: "var(--t-1)" }}>
            Institutional tools.<br />
            <span className="grad-cyan">Democratized.</span>
          </h2>
          <p className="text-hero-sub max-w-lg mx-auto" style={{ fontSize: "0.95rem" }}>
            Everything a hedge fund manager needs — accessible to anyone with a thesis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="glass noise rounded-[20px] p-6 relative overflow-hidden group transition-all duration-300"
              style={{ cursor: "default" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,217,255,0.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-1)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{
                background: `${f.color}12`,
                border: `1px solid ${f.color}25`,
                color: f.color,
              }}>
                {f.icon}
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: "var(--t-1)", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--t-2)" }}>{f.desc}</p>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-5" style={{
                background: `radial-gradient(circle at top right, ${f.color}, transparent)`,
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="relative px-6 py-24 max-w-6xl mx-auto" style={{ zIndex: 1 }}>
        <div className="text-center mb-16">
          <div className="badge badge-amber mb-4">Workflow</div>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: "var(--t-1)" }}>
            Thesis to execution<br />
            <span className="grad-amber">in 5 steps.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px" style={{
            background: "linear-gradient(90deg, transparent 5%, var(--border-1) 20%, var(--border-1) 80%, transparent 95%)"
          }} />
          <div className="grid md:grid-cols-5 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-black"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}20, ${s.color}08)`,
                    border: `1px solid ${s.color}30`,
                    color: s.color,
                    boxShadow: `0 0 20px ${s.color}15`,
                  }}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-xs font-bold mb-1" style={{ color: "var(--t-1)" }}>{s.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--t-3)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live index showcase ─────────────────────────────────────── */}
      <section id="indexes" className="relative px-6 py-24 max-w-6xl mx-auto" style={{ zIndex: 1 }}>
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="badge badge-green mb-3">
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              Live Indexes
            </div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--t-1)" }}>Top performing this week</h2>
          </div>
          <Link href="/app/marketplace" className="btn-ghost-sm">
            View all <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...ssiIndexes].sort((a, b) => b.perf7d - a.perf7d).map((idx) => {
            const tags = SECTOR_TAGS[idx.indexCode] ?? [];
            return (
              <Link key={idx.indexId} href="/app/marketplace" style={{ textDecoration: "none" }}>
                <div className="glass noise rounded-[20px] p-5 h-full transition-all duration-200"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,217,255,0.15)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-1)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold mb-0.5" style={{ color: "var(--t-1)" }}>{idx.indexName}</div>
                      <div className="text-xs" style={{ color: "var(--t-3)" }}>by SoSoValue</div>
                    </div>
                    <div className="badge badge-green" style={{ fontSize: 9 }}>
                      <span className="live-dot" style={{ width: 4, height: 4 }} /> Live
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--t-2)" }}>
                    {idx.description ?? `Tracks the top ${tags[0] ?? ""} tokens weighted by market cap and momentum signals.`}
                  </p>
                  <div className="sep mb-4" />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="label-caps mb-1">7d Return</div>
                      <div className="num-lg mono" style={{ color: idx.perf7d >= 0 ? "var(--green)" : "var(--red)" }}>
                        {idx.perf7d >= 0 ? "+" : ""}{idx.perf7d.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="label-caps mb-1">24h</div>
                      <div className="text-sm font-bold mono" style={{ color: idx.changePercent >= 0 ? "var(--green)" : "var(--red)" }}>
                        {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="label-caps mb-1">Tokens</div>
                      <div className="text-sm font-bold" style={{ color: "var(--t-2)" }}>{idx.tokens.length}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {tags.map((t) => <span key={t} className="badge badge-cyan" style={{ fontSize: 9 }}>{t}</span>)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 max-w-3xl mx-auto text-center" style={{ zIndex: 1 }}>
        <div className="glow-border">
          <div className="glass noise rounded-[28px] p-16 relative overflow-hidden">
            <div className="orb orb-cyan w-80 h-80 -top-20 -left-20 opacity-30" />
            <div className="orb orb-violet w-72 h-72 -bottom-20 -right-20 opacity-25" />
            <div className="relative z-10">
              <div className="badge badge-cyan mb-6">Get started free</div>
              <h2 className="text-4xl font-black tracking-tight mb-4" style={{ color: "var(--t-1)" }}>
                Your index.<br />
                <span className="grad-cyan">On-chain.</span>
              </h2>
              <p className="text-hero-sub mb-8 max-w-sm mx-auto" style={{ fontSize: "0.9rem" }}>
                Build a thematic index in under 3 minutes. No quant skills required.
              </p>
              <Link href="/app/builder" className="btn btn-cyan px-10 py-4 text-sm">
                <Zap size={18} /> Start Building <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative px-8 py-8" style={{ zIndex: 1, borderTop: "1px solid var(--border-0)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--cyan), var(--violet))" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            <span className="text-xs font-black tracking-widest" style={{ color: "var(--t-1)", letterSpacing: "0.15em" }}>ATLAS</span>
          </div>
          <div className="label-caps text-center" style={{ color: "var(--t-3)" }}>
            SoSoValue Hackathon Wave 1 · Built with SoSoValue API + SoDEX API + Claude AI
          </div>
          <div className="flex items-center gap-5">
            {["SoSoValue API", "SoDEX Docs", "GitHub"].map((l) => (
              <a key={l} href="#" className="label-caps transition-colors" style={{ color: "var(--t-3)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--t-2)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--t-3)")}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: <Brain size={20}/>,    color:"var(--cyan)",   title:"AI Index Construction",   desc:"Describe any thesis in plain English — Claude AI reads live SoSoValue ETF flows, SSI indexes, and news to build an optimized, risk-weighted basket with per-token rationale." },
  { icon: <Activity size={20}/>, color:"var(--amber)",  title:"Institutional Data Layer", desc:"SoSoValue ETF flows, SSI sector indexes, macro events, and news feed power every signal — the same data used by institutional desks." },
  { icon: <Zap size={20}/>,      color:"var(--green)",  title:"SoDEX Multi-Leg Execution",desc:"Execute your entire basket in one flow via SoDEX — EIP-712 signed IOC limit orders with live slippage preview before you confirm." },
  { icon: <Shield size={20}/>,   color:"var(--violet)",  title:"Confirmation Gate",       desc:"Every irreversible action requires explicit user confirmation with a full breakdown — position sizing, fee estimates, expected slippage." },
  { icon: <Layers size={20}/>,   color:"var(--amber)",  title:"AI Rebalancing",           desc:"Set conditions. ATLAS monitors your index against live SoSoValue signals and proposes rebalances with cited data — you approve every move." },
  { icon: <Globe size={20}/>,    color:"var(--cyan)",   title:"Index Marketplace",        desc:"Publish your index, build a verified on-chain track record, and let others subscribe and copy-execute your strategy." },
];

const STEPS = [
  { title:"Write Thesis",     desc:"Describe your view in plain English",              icon:<Brain size={18}/>,    color:"var(--cyan)"   },
  { title:"AI Analyzes Data", desc:"SoSoValue API + Claude construct the basket",       icon:<Activity size={18}/>, color:"var(--violet)" },
  { title:"Review Proposal",  desc:"Inspect every token, weight, and signal rationale", icon:<BarChart3 size={18}/>, color:"var(--amber)"  },
  { title:"Confirm & Execute",desc:"SoDEX multi-leg execution with slippage preview",   icon:<Zap size={18}/>,      color:"var(--green)"  },
  { title:"Track & Rebalance",desc:"Monitor performance, approve AI rebalances",        icon:<TrendingUp size={18}/>, color:"var(--cyan)"  },
];

