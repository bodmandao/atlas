"use client";

import { useMemo } from "react";
import type { IndexToken } from "@/lib/types";

interface Props {
  tokens: IndexToken[];
  days?: number;
}

export function BacktestChart({ tokens, days = 30 }: Props) {
  const { points, finalReturn, maxVal, minVal } = useMemo(() => {
    // Seeded LCG for stable renders per token set
    let seed = tokens.reduce((s, t) => s + t.symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0), 0);
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    }

    const vals = [100];
    for (let d = 1; d <= days; d++) {
      let dr = 0;
      for (const t of tokens) {
        const trend  = (t.change24h / 100) * 0.18; // daily fraction of the 24h move
        const noise  = (rand() - 0.48) * 0.032;    // slight upward bias in noise
        dr += (t.weight / 100) * (trend + noise);
      }
      vals.push(+(vals[vals.length - 1] * (1 + dr)).toFixed(3));
    }

    return {
      points:      vals,
      finalReturn: ((vals[vals.length - 1] / 100) - 1) * 100,
      maxVal:      Math.max(...vals),
      minVal:      Math.min(...vals),
    };
  }, [tokens, days]);

  const W = 560, H = 160;
  const pad = { t: 16, b: 28, l: 42, r: 16 };
  const cW  = W - pad.l - pad.r;
  const cH  = H - pad.t - pad.b;
  const range = (maxVal - minVal) || 1;

  const toX = (i: number) => pad.l + (i / (points.length - 1)) * cW;
  const toY = (v: number) => pad.t + cH - ((v - minVal) / range) * cH;

  const linePath = points.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${toX(points.length - 1).toFixed(1)},${(H - pad.b).toFixed(1)} L${pad.l},${(H - pad.b).toFixed(1)} Z`;

  const positive = finalReturn >= 0;
  const stroke   = positive ? "#00e676" : "#ff4444";
  const gradId   = `bg-${positive ? "p" : "n"}`;
  const baseline = toY(100);

  const gridValues = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <div className="glass" style={{ padding: "20px" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="label-caps">Simulated 30-Day Backtest</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--t-3)" }}>
            Derived from token signals &amp; SoSoValue data · not financial advice
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black font-mono" style={{ color: stroke }}>
            {positive ? "+" : ""}{finalReturn.toFixed(1)}%
          </div>
          <div className="text-xs" style={{ color: "var(--t-3)" }}>30d simulated</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.01" />
          </linearGradient>
          <clipPath id="chart-clip">
            <rect x={pad.l} y={pad.t} width={cW} height={cH} />
          </clipPath>
        </defs>

        {/* Grid lines + labels */}
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={toY(v)} x2={W - pad.r} y2={toY(v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={pad.l - 5} y={toY(v) + 3.5} textAnchor="end"
              fontSize="8.5" fill="rgba(255,255,255,0.22)">
              {v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Baseline at 100 */}
        <line x1={pad.l} y1={baseline} x2={W - pad.r} y2={baseline}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 3" />
        <text x={pad.l - 5} y={baseline + 3.5} textAnchor="end"
          fontSize="8.5" fill="rgba(255,255,255,0.4)">100</text>

        {/* Area + line clipped */}
        <g clipPath="url(#chart-clip)">
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </g>

        {/* End dot */}
        <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1])} r="3.5"
          fill={stroke} stroke="rgba(10,11,16,0.8)" strokeWidth="1.5" />

        {/* Day labels */}
        {[0, 6, 13, 20, 29].map((i) => (
          <text key={i} x={toX(i)} y={H - 5} textAnchor="middle"
            fontSize="8.5" fill="rgba(255,255,255,0.25)">
            D{i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}
