"use client";

import { useState } from "react";
import {
  Brain, Zap, Shield, ArrowRight, RefreshCw, ChevronDown,
  ChevronUp, AlertTriangle, CheckCircle2, Loader2, Sparkles,
  BarChart3, Activity
} from "lucide-react";
import { IndexProposal, IndexToken } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

const THESIS_EXAMPLES = [
  "AI infrastructure tokens with strong institutional ETF inflows and positive momentum",
  "DeFi lending protocols with high TVL growth and whale accumulation signals",
  "Layer 2 Ethereum scaling solutions with growing developer activity and transaction volume",
  "Real world asset tokenization protocols with active institutional partnerships",
  "Privacy-focused tokens benefiting from growing regulatory scrutiny of on-chain data",
  "BTC ecosystem infrastructure plays correlated with positive ETF flow momentum",
];

const RISK_OPTIONS = [
  { value: "low", label: "Conservative", desc: "Max 8 tokens, diversified, lower volatility", color: "var(--green)" },
  { value: "medium", label: "Balanced", desc: "Max 10 tokens, sector mix, moderate risk", color: "var(--cyan)" },
  { value: "high", label: "Aggressive", desc: "Max 12 tokens, concentrated thesis, higher beta", color: "var(--amber)" },
];

type BuildStep = "input" | "loading" | "review" | "execute" | "confirm" | "done";

const SECTOR_COLORS: Record<string, string> = {
  DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4",
  AI: "#d4a841", RWA: "#10b981", GameFi: "#ec4899",
  Infrastructure: "#6366f1", Privacy: "#84cc16",
};

const SIGNAL_MAP: Record<string, { bg: string; text: string; label: string }> = {
  strong_buy: { bg: "rgba(0,230,118,0.12)", text: "var(--green)", label: "Strong Buy" },
  buy: { bg: "rgba(0,230,118,0.06)", text: "#6ee7b7", label: "Buy" },
  neutral: { bg: "rgba(212,168,65,0.08)", text: "var(--amber)", label: "Neutral" },
  sell: { bg: "rgba(255,68,68,0.08)", text: "var(--red)", label: "Sell" },
  strong_sell: { bg: "rgba(255,68,68,0.12)", text: "var(--red)", label: "Strong Sell" },
};

export default function BuilderPage() {
  const [thesis, setThesis] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [investAmount, setInvestAmount] = useState(1000);
  const [maxTokens, setMaxTokens] = useState(8);
  const [step, setStep] = useState<BuildStep>("input");
  const [proposal, setProposal] = useState<IndexProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);

  const LOADING_MSGS = [
    "Fetching SoSoValue ETF flow data...",
    "Analyzing SSI sector indexes...",
    "Processing market news signals...",
    "Running AI portfolio construction...",
    "Optimizing weights for your risk profile...",
    "Generating token rationales...",
  ];

  async function buildIndex() {
    if (thesis.trim().length < 10) return;
    setStep("loading");
    setError(null);

    const interval = setInterval(() => {
      setLoadingMsg((m) => (m + 1) % LOADING_MSGS.length);
    }, 900);

    try {
      const res = await fetch("/api/build-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thesis, riskLevel, investAmount, maxTokens }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Build failed");
      setProposal(data.proposal);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("input");
    } finally {
      clearInterval(interval);
    }
  }

  const stepOrder = ["input", "loading", "review", "execute", "confirm", "done"];
  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--violet-dim)", color: "#a78bfa" }}
          >
            <Brain size={18} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Index Builder</h1>
          <span className="badge badge-violet">AI-Powered</span>
        </div>
        <p className="text-sm" style={{ color: "var(--t-2)" }}>
          Describe your investment thesis and let ATLAS construct an optimized on-chain index using live SoSoValue data.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: "input", label: "Thesis" },
          { key: "review", label: "Review" },
          { key: "execute", label: "Execute" },
          { key: "done", label: "Done" },
        ].map((s, i, arr) => {
          const target = stepOrder.indexOf(s.key);
          const done = currentStepIdx > target;
          const active = currentStepIdx === target || (s.key === "input" && step === "loading");
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: done ? "var(--green-dim)" : active ? "var(--cyan-dim)" : "var(--bg-3)",
                    color: done ? "var(--green)" : active ? "var(--cyan)" : "var(--t-3)",
                    border: `1px solid ${done ? "rgba(0,230,118,0.3)" : active ? "var(--border-2)" : "var(--border-1)"}`,
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: active ? "var(--t-1)" : "var(--t-3)" }}
                >
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-8 h-px" style={{ background: "var(--border-1)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* STEP: Input */}
      {(step === "input" || step === "loading") && (
        <div className="space-y-6">
          <div className="glass" style={{ padding: "24px" }}>
            <label className="text-sm font-semibold mb-3 block" style={{ color: "var(--t-1)" }}>
              Investment Thesis <span style={{ color: "var(--cyan)" }}>*</span>
            </label>
            <textarea
              className="field"
              style={{ padding: "14px 16px", lineHeight: 1.7, resize: "none" }}
              rows={4}
              placeholder="Describe your investment view in plain English — sector focus, catalyst, data signal, or market thesis..."
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              disabled={step === "loading"}
            />
            <div className="mt-3">
              <div className="label-caps mb-2">Examples</div>
              <div className="flex flex-wrap gap-2">
                {THESIS_EXAMPLES.slice(0, 3).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setThesis(ex)}
                    className="text-xs px-3 py-1.5 transition-colors"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-2)",
                      border: "1px solid var(--border-1)",
                      color: "var(--t-3)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)";
                      (e.currentTarget as HTMLElement).style.color = "var(--t-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-1)";
                      (e.currentTarget as HTMLElement).style.color = "var(--t-3)";
                    }}
                  >
                    {ex.length > 60 ? ex.slice(0, 60) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Config row */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Risk level */}
            <div className="glass" style={{ padding: "16px" }}>
              <div className="label-caps mb-3">Risk Profile</div>
              <div className="space-y-2">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRiskLevel(opt.value)}
                    className="w-full text-left p-2.5 transition-all"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: riskLevel === opt.value ? `color-mix(in srgb, ${opt.color} 8%, transparent)` : "transparent",
                      border: `1px solid ${riskLevel === opt.value ? `color-mix(in srgb, ${opt.color} 30%, transparent)` : "var(--border-1)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: riskLevel === opt.value ? opt.color : "var(--t-2)" }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5 pl-4" style={{ color: "var(--t-3)" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Investment amount */}
            <div className="glass" style={{ padding: "16px" }}>
              <div className="label-caps mb-3">Investment Amount</div>
              <div className="space-y-1.5">
                {[100, 500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setInvestAmount(amt)}
                    className="w-full text-sm font-mono py-2 px-3 transition-all text-left"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: investAmount === amt ? "var(--cyan-dim)" : "var(--bg-2)",
                      border: `1px solid ${investAmount === amt ? "var(--border-2)" : "var(--border-1)"}`,
                      color: investAmount === amt ? "var(--cyan)" : "var(--t-2)",
                    }}
                  >
                    ${amt.toLocaleString()} USDC
                  </button>
                ))}
              </div>
            </div>

            {/* Max tokens + Data sources */}
            <div className="glass" style={{ padding: "16px" }}>
              <div className="label-caps mb-3">Max Tokens</div>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {[5, 6, 8, 10, 12, 15].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxTokens(n)}
                    className="py-2 text-sm font-bold transition-all"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: maxTokens === n ? "var(--cyan-dim)" : "var(--bg-2)",
                      border: `1px solid ${maxTokens === n ? "var(--border-2)" : "var(--border-1)"}`,
                      color: maxTokens === n ? "var(--cyan)" : "var(--t-2)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="label-caps mb-2">Data Sources</div>
              <div className="space-y-1.5">
                {[
                  { label: "SoSoValue ETF Flows", color: "var(--cyan)" },
                  { label: "SSI Sector Indexes", color: "#a78bfa" },
                  { label: "Market News Feed", color: "var(--green)" },
                  { label: "Claude AI Reasoning", color: "var(--amber)" },
                ].map((src) => (
                  <div key={src.label} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: src.color }} />
                    <span className="text-xs" style={{ color: "var(--t-2)" }}>{src.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div
              className="p-4 flex items-center gap-3"
              style={{
                borderRadius: "var(--radius-md)",
                background: "var(--red-dim)",
                border: "1px solid rgba(255,68,68,0.2)",
              }}
            >
              <AlertTriangle size={16} style={{ color: "var(--red)" }} />
              <span className="text-sm" style={{ color: "#fca5a5" }}>{error}</span>
            </div>
          )}

          <button
            onClick={buildIndex}
            disabled={thesis.trim().length < 10 || step === "loading"}
            className="btn btn-cyan w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ justifyContent: "center" }}
          >
            {step === "loading" ? (
              <>
                <Loader2 size={18} className="spin-ring" />
                {LOADING_MSGS[loadingMsg]}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Build Index with AI
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP: Review */}
      {step === "review" && proposal && (
        <div className="space-y-6">
          <div className="border-gradient">
            <div className="glass" style={{ padding: "24px" }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-black mb-1" style={{ color: "var(--t-1)" }}>{proposal.name}</h2>
                  <p className="text-sm" style={{ color: "var(--t-2)" }}>{proposal.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span className="badge badge-green">{proposal.riskLevel}</span>
                  <span className="badge badge-cyan">{proposal.tokens.length} tokens</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { label: "Expected Return", value: proposal.expectedReturn, color: "var(--green)" },
                  { label: "AI Confidence", value: `${proposal.aiConfidence}%`, color: "#a78bfa" },
                  { label: "Invest Amount", value: `$${proposal.totalValue.toLocaleString()}`, color: "var(--cyan)" },
                  { label: "Rebalance", value: proposal.rebalanceFrequency, color: "var(--amber)" },
                ].map((m) => (
                  <div key={m.label} className="text-center glass-inset py-3">
                    <div className="label-caps mb-1">{m.label}</div>
                    <div className="text-lg font-black font-mono" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div
                className="p-4"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--cyan-dim)",
                  border: "1px solid var(--border-2)",
                }}
              >
                <div className="label-caps mb-2" style={{ color: "var(--cyan)" }}>
                  SoSoValue Data Signals
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span style={{ color: "var(--t-3)" }}>ETF Flow: </span>
                    <span style={{ color: "var(--t-2)" }}>{proposal.dataSignals.etfFlowSignal}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--t-3)" }}>Sentiment: </span>
                    <span style={{ color: proposal.dataSignals.sentimentScore >= 0 ? "var(--green)" : "var(--red)" }}>
                      {proposal.dataSignals.sentimentScore}/100
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span style={{ color: "var(--t-3)" }}>Macro: </span>
                    <span style={{ color: "var(--t-2)" }}>{proposal.dataSignals.macroContext}</span>
                  </div>
                  {proposal.dataSignals.newsSignals.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span style={{ color: "var(--cyan)" }}>→</span>
                      <span style={{ color: "var(--t-2)" }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Token table */}
          <div>
            <div className="label-caps mb-3">Proposed Token Basket</div>
            <div className="space-y-2">
              {proposal.tokens.map((token, i) => (
                <TokenCard
                  key={token.symbol}
                  token={token}
                  rank={i + 1}
                  totalValue={proposal.totalValue}
                  expanded={expandedToken === token.symbol}
                  onToggle={() => setExpandedToken(expandedToken === token.symbol ? null : token.symbol)}
                />
              ))}
            </div>
          </div>

          <WeightChart tokens={proposal.tokens} />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setStep("input"); setProposal(null); }}
              className="btn btn-outline px-6 py-3 text-sm"
            >
              <RefreshCw size={15} /> Rebuild
            </button>
            <button
              onClick={() => setStep("execute")}
              className="btn btn-cyan flex-1 py-3 text-sm"
              style={{ justifyContent: "center" }}
            >
              <Zap size={16} />
              Proceed to Execution
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === "execute" && proposal && (
        <ExecutionPreview
          proposal={proposal}
          onConfirm={() => setStep("confirm")}
          onBack={() => setStep("review")}
        />
      )}

      {step === "confirm" && proposal && (
        <ConfirmationGate
          proposal={proposal}
          onConfirm={() => setStep("done")}
          onBack={() => setStep("execute")}
        />
      )}

      {step === "done" && proposal && (
        <div className="text-center py-16 space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--green-dim)", border: "2px solid rgba(0,230,118,0.3)" }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--green)" }} />
          </div>
          <h2 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Index Created!</h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--t-2)" }}>
            <strong style={{ color: "var(--t-1)" }}>{proposal.name}</strong> has been added to your portfolio.
            Execution orders have been submitted to SoDEX testnet.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <a href="/app/portfolio" className="btn btn-cyan px-6 py-2.5 text-sm">
              <BarChart3 size={15} /> View Portfolio
            </a>
            <button
              onClick={() => { setStep("input"); setThesis(""); setProposal(null); }}
              className="btn btn-outline px-6 py-2.5 text-sm"
            >
              Build Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TokenCard({
  token, rank, totalValue, expanded, onToggle
}: {
  token: IndexToken; rank: number; totalValue: number; expanded: boolean; onToggle: () => void;
}) {
  const sc = SECTOR_COLORS[token.sector] ?? "#8aa3c4";
  const sig = SIGNAL_MAP[token.signal] ?? SIGNAL_MAP.neutral;
  const allocUSD = (token.weight / 100) * totalValue;

  return (
    <div
      className="overflow-hidden cursor-pointer"
      style={{ borderRadius: "var(--radius-md)", background: "var(--bg-2)", border: "1px solid var(--border-1)" }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-6 text-center text-xs font-bold" style={{ color: "var(--t-3)" }}>{rank}</div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${sc}20`, color: sc, border: `1px solid ${sc}40` }}
        >
          {token.symbol.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{token.symbol}</span>
            <span className="text-xs" style={{ color: "var(--t-3)" }}>{token.name}</span>
          </div>
          <div className="text-xs" style={{ color: "var(--t-3)" }}>{token.sector}</div>
        </div>
        <div className="hidden sm:block w-32">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border-1)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${token.weight}%`, background: `linear-gradient(90deg, ${sc}, ${sc}66)` }}
              />
            </div>
            <span className="text-xs font-bold w-9 text-right" style={{ color: "var(--t-2)" }}>
              {token.weight.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="text-right w-20 hidden md:block">
          <div className="text-sm font-mono" style={{ color: "var(--t-1)" }}>${token.price.toLocaleString()}</div>
          <div className="text-xs" style={{ color: token.change24h >= 0 ? "var(--green)" : "var(--red)" }}>
            {formatPercent(token.change24h)}
          </div>
        </div>
        <div
          className="badge hidden lg:inline-flex"
          style={{ background: sig.bg, color: sig.text, border: `1px solid ${sig.text}30` }}
        >
          {sig.label}
        </div>
        <div className="text-right w-20 hidden sm:block">
          <div className="text-sm font-mono font-bold" style={{ color: "var(--cyan)" }}>
            ${allocUSD.toFixed(0)}
          </div>
          <div className="text-xs" style={{ color: "var(--t-3)" }}>alloc.</div>
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: "var(--t-3)" }} />
          : <ChevronDown size={14} style={{ color: "var(--t-3)" }} />
        }
      </div>
      {expanded && (
        <div className="px-4 pb-4 pl-14" style={{ borderTop: "1px solid var(--border-1)" }}>
          <div className="pt-3 text-xs leading-relaxed" style={{ color: "var(--t-2)" }}>
            <span className="font-semibold" style={{ color: "var(--cyan)" }}>AI Rationale: </span>
            {token.rationale}
          </div>
        </div>
      )}
    </div>
  );
}

function WeightChart({ tokens }: { tokens: IndexToken[] }) {
  return (
    <div className="glass" style={{ padding: "20px" }}>
      <div className="label-caps mb-4">Portfolio Composition</div>
      <div className="flex h-6 rounded-lg overflow-hidden mb-4">
        {tokens.map((t) => {
          const col = SECTOR_COLORS[t.sector] ?? "#8aa3c4";
          return (
            <div
              key={t.symbol}
              style={{ width: `${t.weight}%`, background: col, opacity: 0.75 }}
              title={`${t.symbol}: ${t.weight}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {tokens.map((t) => {
          const col = SECTOR_COLORS[t.sector] ?? "#8aa3c4";
          return (
            <div key={t.symbol} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: col }} />
              <span className="text-xs font-medium" style={{ color: "var(--t-2)" }}>{t.symbol}</span>
              <span className="text-xs font-mono" style={{ color: "var(--t-3)" }}>{t.weight}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExecutionPreview({
  proposal, onConfirm, onBack
}: {
  proposal: IndexProposal; onConfirm: () => void; onBack: () => void;
}) {
  const legs = proposal.tokens.map((t) => ({
    symbol: t.symbol,
    usdAmount: (t.weight / 100) * proposal.totalValue,
    estimatedQty: ((t.weight / 100) * proposal.totalValue) / t.price,
    estimatedPrice: t.price,
    slippageBps: Math.round(Math.random() * 15 + 2),
    market: `${t.symbol}-USDC`,
  }));

  const totalFees = legs.reduce((s, l) => s + l.usdAmount * 0.001, 0);
  const totalSlippage = legs.reduce((s, l) => s + l.usdAmount * (l.slippageBps / 10000), 0);

  return (
    <div className="space-y-6">
      <div className="glass" style={{ padding: "20px" }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: "var(--cyan)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--t-1)" }}>SoDEX Execution Plan</h2>
          <span className="badge badge-cyan ml-auto">Testnet</span>
        </div>
        <div className="space-y-2 mb-5">
          {legs.map((leg) => (
            <div
              key={leg.symbol}
              className="flex items-center gap-3 p-3"
              style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-2)", border: "1px solid var(--border-1)" }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--green)" }} />
              <span className="text-sm font-bold w-16" style={{ color: "var(--t-1)" }}>{leg.symbol}</span>
              <span className="text-xs flex-1" style={{ color: "var(--t-3)" }}>
                BUY {leg.estimatedQty.toFixed(4)} @ ~${leg.estimatedPrice.toLocaleString()}
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--cyan)" }}>${leg.usdAmount.toFixed(0)} USDC</span>
              <span className="text-xs" style={{ color: "var(--t-3)" }}>{leg.slippageBps}bps slip</span>
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-3 gap-4 p-4"
          style={{ borderRadius: "var(--radius-md)", background: "var(--cyan-dim)", border: "1px solid var(--border-2)" }}
        >
          <div className="text-center">
            <div className="label-caps mb-1">Total Outlay</div>
            <div className="text-base font-black font-mono" style={{ color: "var(--t-1)" }}>
              ${proposal.totalValue.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="label-caps mb-1">Est. Fees</div>
            <div className="text-base font-black font-mono" style={{ color: "var(--amber)" }}>
              ${totalFees.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="label-caps mb-1">Max Slippage</div>
            <div className="text-base font-black font-mono" style={{ color: "var(--red)" }}>
              ${totalSlippage.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-outline px-6 py-3 text-sm">
          ← Back
        </button>
        <button
          onClick={onConfirm}
          className="btn btn-cyan flex-1 py-3 text-sm"
          style={{ justifyContent: "center" }}
        >
          <Shield size={16} /> Review & Confirm
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function ConfirmationGate({
  proposal, onConfirm, onBack
}: {
  proposal: IndexProposal; onConfirm: () => void; onBack: () => void;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="space-y-6">
      <div
        className="p-6"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--amber-dim)",
          border: "2px solid rgba(212,168,65,0.25)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} style={{ color: "var(--amber)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--amber)" }}>Confirm Irreversible Action</h2>
        </div>
        <div className="space-y-2 text-sm mb-6">
          {[
            `You are submitting ${proposal.tokens.length} buy orders on SoDEX testnet`,
            `Total outlay: $${proposal.totalValue.toLocaleString()} USDC`,
            `Index: "${proposal.name}"`,
            "Orders will execute at market prices with IOC limit order type",
            "Execution cannot be undone once submitted on-chain",
          ].map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: "var(--amber)" }}>·</span>
              <span style={{ color: "var(--t-2)" }}>{line}</span>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--amber)" }}
          />
          <span className="text-sm font-medium" style={{ color: "var(--t-1)" }}>
            I understand this will execute real orders on SoDEX testnet
          </span>
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-outline px-6 py-3 text-sm">
          ← Back
        </button>
        <button
          onClick={onConfirm}
          disabled={!checked}
          className="btn btn-cyan flex-1 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ justifyContent: "center" }}
        >
          <Zap size={16} /> Execute on SoDEX
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
