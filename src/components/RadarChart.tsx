"use client";

import type { IndexProposal } from "@/lib/types";

const SIGNAL_SCORE: Record<string, number> = {
  strong_buy: 95, buy: 72, neutral: 50, sell: 28, strong_sell: 8,
};
const RISK_SAFETY: Record<string, number> = {
  low: 88, medium: 58, high: 30, very_high: 12,
};

interface Axis {
  label: string;
  sub: string;
  value: number;
  color: string;
}

function deriveAxes(p: IndexProposal): Axis[] {
  const momentum = p.tokens.reduce(
    (s, t) => s + (SIGNAL_SCORE[t.signal] ?? 50) * (t.weight / 100), 0
  );

  const sectors       = new Set(p.tokens.map((t) => t.sector)).size;
  const diversify     = Math.min(Math.round((sectors / 6) * 100), 100);

  const safety        = RISK_SAFETY[p.riskLevel] ?? 50;

  const sentiment     = Math.round(((p.dataSignals?.sentimentScore ?? 0) + 100) / 2);

  const returnMatch   = p.expectedReturn?.match(/[\d.]+/);
  const returnPct     = returnMatch ? parseFloat(returnMatch[0]) : 10;
  const conviction    = Math.min(Math.round((returnPct / 50) * 100), 100);

  return [
    { label: "Momentum",    sub: "Signal strength",      value: Math.round(momentum), color: "#00d9ff" },
    { label: "Diversify",   sub: `${sectors} sectors`,   value: diversify,            color: "#a78bfa" },
    { label: "AI Score",    sub: "Confidence",            value: p.aiConfidence,       color: "#d4a841" },
    { label: "Safety",      sub: p.riskLevel + " risk",  value: safety,               color: "#00e676" },
    { label: "Sentiment",   sub: "Market mood",           value: sentiment,            color: "#f472b6" },
    { label: "Conviction",  sub: "Return forecast",       value: conviction,           color: "#fb923c" },
  ];
}

export function RadarChart({ proposal }: { proposal: IndexProposal }) {
  const axes = deriveAxes(proposal);
  const N  = axes.length;
  const CX = 130, CY = 130, R = 90;
  const LR = R + 26; // label radius

  function polar(i: number, r: number) {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  }

  const rings   = [0.25, 0.5, 0.75, 1];
  const dataPts = axes.map((ax, i) => polar(i, (ax.value / 100) * R));
  const dataD   = dataPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  const VB = CX * 2;

  return (
    <div className="glass" style={{ padding: "20px" }}>
      <div className="label-caps mb-4">Index DNA</div>
      <div className="flex flex-col sm:flex-row items-center gap-6">

        {/* Radar SVG */}
        <svg viewBox={`0 0 ${VB} ${VB}`} width="220" height="220" style={{ flexShrink: 0 }}>
          {/* Grid rings */}
          {rings.map((r) => {
            const pts = axes.map((_, i) => polar(i, r * R));
            const d   = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
            return <path key={r} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
          })}

          {/* Spokes */}
          {axes.map((_, i) => {
            const o = polar(i, R);
            return <line key={i} x1={CX} y1={CY} x2={o.x.toFixed(1)} y2={o.y.toFixed(1)}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
          })}

          {/* 25 / 50 / 75 ring labels */}
          {[25, 50, 75].map((v) => (
            <text key={v} x={CX + 3} y={CY - (v / 100) * R + 3}
              fontSize="7.5" fill="rgba(255,255,255,0.2)">{v}</text>
          ))}

          {/* Data polygon */}
          <path d={dataD} fill="rgba(0,217,255,0.09)" stroke="rgba(0,217,255,0.55)" strokeWidth="1.5" />

          {/* Data dots */}
          {dataPts.map((p, i) => (
            <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3"
              fill={axes[i].color} stroke="rgba(10,11,16,0.7)" strokeWidth="1" />
          ))}

          {/* Axis labels */}
          {axes.map((ax, i) => {
            const lp  = polar(i, LR);
            const sp  = polar(i, LR + 11);
            return (
              <g key={i}>
                <text x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="700" fill={ax.color}>
                  {ax.label}
                </text>
                <text x={sp.x.toFixed(1)} y={sp.y.toFixed(1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7.5" fill="rgba(255,255,255,0.3)">
                  {ax.sub}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bar legend */}
        <div className="flex-1 w-full space-y-2.5">
          {axes.map((ax) => (
            <div key={ax.label} className="flex items-center gap-3">
              <div style={{ minWidth: 70 }}>
                <div className="text-xs font-semibold leading-none" style={{ color: ax.color }}>{ax.label}</div>
                <div className="text-xs mt-0.5 leading-none" style={{ color: "var(--t-3)" }}>{ax.sub}</div>
              </div>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-3)" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${ax.value}%`, background: ax.color, opacity: 0.85, transition: "width 0.6s ease" }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: "var(--t-2)", minWidth: 28, textAlign: "right" }}>
                {ax.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
