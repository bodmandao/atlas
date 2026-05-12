"use client";

import { IndexToken } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

const SIGNAL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  strong_buy: { bg: "rgba(16,185,129,0.15)", text: "#34d399", label: "Strong Buy" },
  buy: { bg: "rgba(16,185,129,0.08)", text: "#6ee7b7", label: "Buy" },
  neutral: { bg: "rgba(245,158,11,0.08)", text: "#fde68a", label: "Neutral" },
  sell: { bg: "rgba(239,68,68,0.08)", text: "#fca5a5", label: "Sell" },
  strong_sell: { bg: "rgba(239,68,68,0.15)", text: "#f87171", label: "Strong Sell" },
};

const SECTOR_COLORS: Record<string, string> = {
  DeFi: "#8b5cf6", Layer1: "#3b82f6", Layer2: "#06b6d4",
  AI: "#f59e0b", RWA: "#10b981", GameFi: "#ec4899",
  Infrastructure: "#6366f1", Privacy: "#84cc16", Meme: "#f97316",
};

interface Props {
  token: IndexToken;
  rank: number;
  totalValue?: number;
}

export default function TokenRow({ token, rank, totalValue }: Props) {
  const signal = SIGNAL_COLORS[token.signal] ?? SIGNAL_COLORS.neutral;
  const sectorColor = SECTOR_COLORS[token.sector] ?? "#8aa3c4";

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group cursor-pointer"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      {/* Rank */}
      <div className="w-6 text-center text-xs font-bold" style={{ color: "var(--text-muted)" }}>
        {rank}
      </div>

      {/* Symbol + Sector */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${sectorColor}22`, color: sectorColor, border: `1px solid ${sectorColor}44` }}
        >
          {token.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{token.symbol}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{token.sector}</div>
        </div>
      </div>

      {/* Weight Bar */}
      <div className="flex-1 max-w-[120px] hidden sm:block">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${token.weight}%`, background: `linear-gradient(90deg, ${sectorColor}, ${sectorColor}88)` }}
            />
          </div>
          <span className="text-xs font-semibold w-9 text-right" style={{ color: "var(--text-secondary)" }}>
            {token.weight.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="w-24 text-right hidden md:block">
        <div className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
          ${token.price.toLocaleString()}
        </div>
        <div
          className="text-xs font-medium"
          style={{ color: token.change24h >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}
        >
          {formatPercent(token.change24h)}
        </div>
      </div>

      {/* Signal */}
      <div
        className="tag text-xs hidden lg:flex"
        style={{ background: signal.bg, color: signal.text, border: `1px solid ${signal.bg}` }}
      >
        {signal.label}
      </div>

      {/* Rationale toggle */}
      <div className="w-4 text-right">
        <span style={{ color: "var(--text-muted)" }} className="text-xs group-hover:text-blue-400 transition-colors">›</span>
      </div>
    </div>
  );
}
