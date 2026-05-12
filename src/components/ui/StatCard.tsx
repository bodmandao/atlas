"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  negative?: boolean;
  icon?: React.ReactNode;
  accent?: "blue" | "cyan" | "purple" | "green";
  className?: string;
}

const accentMap = {
  blue: { border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.08)", color: "#60a5fa" },
  cyan: { border: "rgba(6,182,212,0.2)", glow: "rgba(6,182,212,0.08)", color: "#22d3ee" },
  purple: { border: "rgba(139,92,246,0.2)", glow: "rgba(139,92,246,0.08)", color: "#a78bfa" },
  green: { border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.08)", color: "#34d399" },
};

export default function StatCard({ label, value, sub, positive, negative, icon, accent = "blue", className }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={cn("rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]", className)}
      style={{
        background: `linear-gradient(135deg, var(--bg-card), ${a.glow})`,
        border: `1px solid ${a.border}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: a.glow, color: a.color }}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div
          className="text-sm font-medium mt-1"
          style={{
            color: positive ? "var(--accent-green)" : negative ? "var(--accent-red)" : "var(--text-secondary)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
