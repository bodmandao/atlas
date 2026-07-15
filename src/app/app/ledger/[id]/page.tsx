"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronUp, Loader2, Copy, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

interface Finding {
  check: string;
  passed: boolean;
  severity: "info" | "warning" | "critical";
  message: string;
  penalty: number;
}

interface Verification {
  status: "pending" | "completed" | "failed";
  score?: number | null;
  findings?: Finding[] | null;
  toolCalls?: unknown[] | null;
  summary?: string | null;
  model?: string;
  errorMessage?: string | null;
  createdAt?: number;
}

interface CheckpointDetail {
  horizon: string;
  status: "pending" | "resolved" | "insufficient_data";
  dueAt: number;
  resolvedAt: number | null;
  realizedBasketReturn: number | null;
  realizedBenchmarkReturn: number | null;
  benchmarkComposition: { available: boolean; sectorWeights: Record<string, number> } | null;
  missingSymbols: string[] | null;
}

interface LedgerDetail {
  thesisId: string;
  name?: string;
  thesisText: string;
  creator: string;
  status: string;
  canonicalHash: string;
  createdAt: number;
  publishedAt: number | null;
  dataSourceLive: boolean;
  predictedReturn: string;
  proposal: unknown;
  inputSnapshot: unknown;
  rawAiOutput: unknown;
  verification: Verification | null;
  checkpoints: CheckpointDetail[];
}

const HORIZON_LABEL: Record<string, string> = {
  "t+1d": "T+1 day", "t+3d": "T+3 days", "t+7d": "T+7 days", "t+30d": "T+30 days",
};

export default function LedgerDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<LedgerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [showToolCalls, setShowToolCalls] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reVerifying, setReVerifying] = useState(false);
  const [reVerifyError, setReVerifyError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ledger/${params.id}`)
      .then((r) => r.json())
      .then((d) => setDetail(d.error ? null : d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function reVerify() {
    if (reVerifying) return;
    setReVerifying(true);
    setReVerifyError(null);
    try {
      const res = await fetch(`/api/ledger/${params.id}/verify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setReVerifyError(data.error ?? "Re-verification failed");
        return;
      }
      setDetail((prev) => (prev ? { ...prev, verification: { ...data, createdAt: Date.now() } } : prev));
    } catch {
      setReVerifyError("Re-verification failed");
    } finally {
      setReVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-16">
        <Loader2 size={22} className="spin-ring mx-auto mb-2" style={{ color: "var(--cyan)" }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-16">
        <p className="text-sm" style={{ color: "var(--t-3)" }}>Thesis not found.</p>
        <Link href="/app/ledger" className="btn btn-outline px-4 py-2 text-sm mt-4 inline-flex">Back to Ledger</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/app/ledger" className="flex items-center gap-1 text-xs" style={{ color: "var(--t-3)" }}>
        <ChevronLeft size={13} /> Back to Ledger
      </Link>

      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--t-1)" }}>{detail.name ?? "Untitled thesis"}</h1>
        <p className="text-sm" style={{ color: "var(--t-2)" }}>by {detail.creator} · {detail.publishedAt ? new Date(detail.publishedAt).toLocaleString() : "unpublished"}</p>
      </div>

      <div className="glass" style={{ padding: "20px" }}>
        <div className="label-caps mb-2">Thesis</div>
        <p className="text-sm mb-4" style={{ color: "var(--t-2)" }}>{detail.thesisText}</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span style={{ color: "var(--t-3)" }}>Predicted: </span><span style={{ color: "var(--t-1)" }}>{detail.predictedReturn}</span></div>
          <div><span style={{ color: "var(--t-3)" }}>Data source at build: </span><span style={{ color: detail.dataSourceLive ? "var(--green)" : "var(--amber)" }}>{detail.dataSourceLive ? "live" : "mock"}</span></div>
        </div>
      </div>

      <div className="glass" style={{ padding: "18px 20px" }}>
        <div className="label-caps mb-3">Canonical Hash</div>
        <div className="glass-inset p-3 flex items-center gap-3 mb-2">
          <span className="font-mono text-xs flex-1 break-all" style={{ color: "var(--cyan)" }}>{detail.canonicalHash}</span>
          <button onClick={() => { navigator.clipboard.writeText(detail.canonicalHash); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1 text-xs px-2 py-1 flex-shrink-0"
            style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-2)", border: "1px solid var(--border-1)", color: copied ? "var(--green)" : "var(--t-3)" }}>
            <Copy size={10} />{copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--t-3)" }}>
          keccak256 over the full input snapshot, the AI&apos;s raw output, and the resulting proposal —
          computed the moment the thesis was generated, before publish. Nothing about it can be edited after the fact.
        </p>

        <button onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1 text-xs mt-4" style={{ color: "var(--cyan)" }}>
          {showContext ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showContext ? "Hide" : "View"} AI context (what was hashed)
        </button>
        {showContext && (
          <pre className="glass-inset mt-3 p-3 text-xs overflow-auto" style={{ maxHeight: 320, color: "var(--t-2)" }}>
{JSON.stringify({ inputSnapshot: detail.inputSnapshot, rawAiOutput: detail.rawAiOutput, proposal: detail.proposal }, null, 2)}
          </pre>
        )}
      </div>

      <div className="glass" style={{ padding: "18px 20px" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="label-caps">Rigor Verification</div>
          <button onClick={reVerify} disabled={reVerifying}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 disabled:opacity-50"
            style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-2)", border: "1px solid var(--border-1)", color: "var(--t-3)" }}>
            <RefreshCw size={11} className={reVerifying ? "spin-ring" : ""} />
            {reVerifying ? "Re-verifying…" : "Re-verify"}
          </button>
        </div>

        {reVerifyError && (
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "var(--amber)" }}>
            <AlertTriangle size={12} /> {reVerifyError}
          </div>
        )}

        {!detail.verification && (
          <p className="text-xs" style={{ color: "var(--t-3)" }}>Published before rigor verification existed — click Re-verify to check it now.</p>
        )}

        {detail.verification?.status === "pending" && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--t-3)" }}>
            <Loader2 size={14} className="spin-ring" /> Verifying…
          </div>
        )}

        {detail.verification?.status === "failed" && (
          <div className="text-xs" style={{ color: "var(--amber)" }}>
            Verification failed: {detail.verification.errorMessage ?? "unknown error"}
          </div>
        )}

        {detail.verification?.status === "completed" && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="num-xl mono" style={{
                color: (detail.verification.score ?? 0) >= 80 ? "var(--green)" : (detail.verification.score ?? 0) >= 50 ? "var(--amber)" : "var(--red)",
              }}>
                {detail.verification.score}
              </div>
              {detail.verification.summary && (
                <p className="text-xs flex-1" style={{ color: "var(--t-2)" }}>{detail.verification.summary}</p>
              )}
            </div>

            <div className="space-y-1.5">
              {(detail.verification.findings ?? []).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {f.passed
                    ? <CheckCircle2 size={13} style={{ color: "var(--green)", flexShrink: 0, marginTop: 1 }} />
                    : <XCircle size={13} style={{ color: f.severity === "critical" ? "var(--red)" : "var(--amber)", flexShrink: 0, marginTop: 1 }} />}
                  <span style={{ color: "var(--t-2)" }}>{f.message}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowToolCalls(!showToolCalls)}
              className="flex items-center gap-1 text-xs mt-4" style={{ color: "var(--cyan)" }}>
              {showToolCalls ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showToolCalls ? "Hide" : "View"} verification tool calls
            </button>
            {showToolCalls && (
              <pre className="glass-inset mt-3 p-3 text-xs overflow-auto" style={{ maxHeight: 320, color: "var(--t-2)" }}>
{JSON.stringify(detail.verification.toolCalls, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>

      <div>
        <div className="label-caps mb-3">Checkpoints</div>
        <div className="space-y-2">
          {detail.checkpoints.map((c) => (
            <CheckpointRow key={c.horizon} checkpoint={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckpointRow({ checkpoint }: { checkpoint: CheckpointDetail }) {
  const label = HORIZON_LABEL[checkpoint.horizon] ?? checkpoint.horizon;

  return (
    <div className="glass-row px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: "var(--t-1)" }}>{label}</span>
        <span className="text-xs" style={{ color: "var(--t-3)" }}>
          due {new Date(checkpoint.dueAt).toLocaleDateString()}
        </span>
      </div>
      {checkpoint.status === "pending" && (
        <div className="text-xs" style={{ color: "var(--t-3)" }}>Pending — not due yet, or awaiting the next resolution run.</div>
      )}
      {checkpoint.status === "insufficient_data" && (
        <div className="text-xs" style={{ color: "var(--amber)" }}>
          Insufficient price data for: {checkpoint.missingSymbols?.join(", ") ?? "unknown symbols"}
        </div>
      )}
      {checkpoint.status === "resolved" && (
        <div className="flex items-center gap-4 text-xs">
          <span style={{ color: "var(--t-2)" }}>
            Basket:{" "}
            <span style={{ color: (checkpoint.realizedBasketReturn ?? 0) >= 0 ? "var(--green)" : "var(--red)" }} className="font-mono font-bold">
              {((checkpoint.realizedBasketReturn ?? 0) * 100).toFixed(2)}%
            </span>
          </span>
          <span style={{ color: "var(--t-2)" }}>
            Benchmark:{" "}
            {checkpoint.realizedBenchmarkReturn === null
              ? <span style={{ color: "var(--t-3)" }}>unavailable</span>
              : <span className="font-mono font-bold" style={{ color: "var(--t-1)" }}>{(checkpoint.realizedBenchmarkReturn * 100).toFixed(2)}%</span>}
          </span>
        </div>
      )}
    </div>
  );
}
