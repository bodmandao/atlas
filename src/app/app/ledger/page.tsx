"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Copy, Loader2, ChevronRight, Loader } from "lucide-react";

interface CheckpointSummary {
  horizon: string;
  status: "pending" | "resolved" | "insufficient_data";
  dueAt: number;
  realizedBasketReturn: number | null;
  realizedBenchmarkReturn: number | null;
}

interface LedgerEntry {
  thesisId: string;
  name: string;
  creator: string;
  canonicalHash: string;
  publishedAt: number | null;
  verification: { score: number | null; status: string | null };
  checkpoints: CheckpointSummary[];
}

const HORIZON_LABEL: Record<string, string> = {
  "t+1d": "T+1d", "t+3d": "T+3d", "t+7d": "T+7d", "t+30d": "T+30d",
};

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ledger")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyHash(id: string, hash: string) {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,230,118,0.1)", color: "var(--green)" }}>
            <ShieldCheck size={18} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--t-1)" }}>Ledger</h1>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: "var(--t-2)" }}>
          Every published thesis is hashed at the moment the AI generates it — before any client
          can edit it — and measured honestly against reality as time passes. No claim here is
          about whether the AI has alpha; it&apos;s a record of whether each prediction was right,
          with the receipts.
        </p>
      </div>

      {loading ? (
        <div className="glass text-center py-12">
          <Loader2 size={22} className="spin-ring mx-auto mb-2" style={{ color: "var(--cyan)" }} />
          <div className="text-sm" style={{ color: "var(--t-3)" }}>Loading ledger…</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="glass text-center py-10">
          <p className="text-sm mb-3" style={{ color: "var(--t-3)" }}>Nothing published yet.</p>
          <Link href="/app/builder" className="btn btn-cyan px-5 py-2 text-sm">
            Build &amp; publish the first thesis
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.thesisId} className="glass" style={{ padding: "18px 20px" }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link href={`/app/ledger/${e.thesisId}`}
                    className="text-sm font-bold hover:underline flex items-center gap-1"
                    style={{ color: "var(--t-1)" }}>
                    {e.name} <ChevronRight size={13} />
                  </Link>
                  <div className="text-xs mt-0.5" style={{ color: "var(--t-3)" }}>
                    by {e.creator} · {e.publishedAt ? new Date(e.publishedAt).toLocaleDateString() : "—"}
                  </div>
                </div>
                <VerificationChip verification={e.verification} />
              </div>

              <div className="glass-inset p-2.5 flex items-center gap-2 mb-3">
                <span className="font-mono text-xs flex-1 truncate" style={{ color: "var(--cyan)" }}>
                  {e.canonicalHash}
                </span>
                <button onClick={() => copyHash(e.thesisId, e.canonicalHash)}
                  className="flex items-center gap-1 text-xs px-2 py-1 flex-shrink-0"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-2)", border: "1px solid var(--border-1)", color: copiedId === e.thesisId ? "var(--green)" : "var(--t-3)" }}>
                  <Copy size={10} />{copiedId === e.thesisId ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {e.checkpoints.map((c) => (
                  <CheckpointPill key={c.horizon} checkpoint={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationChip({ verification }: { verification: { score: number | null; status: string | null } }) {
  if (verification.status === "pending") {
    return (
      <span className="badge flex-shrink-0" style={{ background: "var(--bg-3)", color: "var(--t-3)", border: "1px solid var(--border-1)" }}>
        <Loader size={10} className="spin-ring" /> Verifying…
      </span>
    );
  }
  if (verification.status === "failed") {
    return <span className="badge badge-amber flex-shrink-0">Verification failed</span>;
  }
  if (verification.status === "completed" && verification.score !== null) {
    const s = verification.score;
    const color = s >= 80 ? "var(--green)" : s >= 50 ? "var(--amber)" : "var(--red)";
    const bg = s >= 80 ? "rgba(0,230,118,0.1)" : s >= 50 ? "rgba(212,168,65,0.1)" : "rgba(255,68,68,0.1)";
    return (
      <span className="badge flex-shrink-0" style={{ background: bg, color, border: `1px solid ${color}40` }}>
        Rigor {s}
      </span>
    );
  }
  return null;
}

function CheckpointPill({ checkpoint }: { checkpoint: CheckpointSummary }) {
  const label = HORIZON_LABEL[checkpoint.horizon] ?? checkpoint.horizon;

  if (checkpoint.status === "pending") {
    return (
      <span className="badge" style={{ background: "var(--bg-3)", color: "var(--t-3)", border: "1px solid var(--border-1)" }}>
        {label} · pending
      </span>
    );
  }
  if (checkpoint.status === "insufficient_data") {
    return (
      <span className="badge badge-amber">{label} · insufficient data</span>
    );
  }
  const r = checkpoint.realizedBasketReturn ?? 0;
  const b = checkpoint.realizedBenchmarkReturn;
  return (
    <span className="badge" style={{ background: r >= 0 ? "rgba(0,230,118,0.1)" : "rgba(255,68,68,0.1)", color: r >= 0 ? "var(--green)" : "var(--red)", border: `1px solid ${r >= 0 ? "rgba(0,230,118,0.25)" : "rgba(255,68,68,0.25)"}` }}>
      {label} · {(r * 100).toFixed(1)}%{b !== null ? ` (vs ${(b * 100).toFixed(1)}%)` : ""}
    </span>
  );
}
