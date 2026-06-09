"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

const FALLBACK: TickerItem[] = [
  { symbol: "SSI DeFi",  price: 0, change: 0 },
  { symbol: "SSI AI",    price: 0, change: 0 },
  { symbol: "SSI L1",    price: 0, change: 0 },
  { symbol: "SSI L2",    price: 0, change: 0 },
  { symbol: "SSI RWA",   price: 0, change: 0 },
];

function TickerItem({ item, isEtf }: { item: TickerItem; isEtf: boolean }) {
  const up    = item.change >= 0;
  const color = item.change === 0 ? "var(--t-3)" : up ? "var(--green)" : "var(--red)";

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xs font-bold" style={{ color: "var(--t-3)" }}>
        {item.symbol}
      </span>
      <span className="text-xs font-mono" style={{ color: "var(--t-1)" }}>
        {isEtf ? `$${item.price.toFixed(2)}B` : item.price.toFixed(3)}
      </span>
      {item.change !== 0 && (
        <span className="text-xs font-semibold" style={{ color }}>
          {up ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
        </span>
      )}
      <span className="text-xs" style={{ color: "var(--border-1)" }}>·</span>
    </div>
  );
}

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK);
  const [live, setLive]   = useState(false);

  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.json())
      .then((d) => {
        if (d.items?.length) { setItems(d.items); setLive(d.live); }
      })
      .catch(() => {});

    // Refresh every 60s
    const id = setInterval(() => {
      fetch("/api/ticker")
        .then((r) => r.json())
        .then((d) => { if (d.items?.length) { setItems(d.items); setLive(d.live); } })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const doubled = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        borderBottom: "1px solid var(--border-1)",
        background: "rgba(5,9,15,0.97)",
        height: "32px",
      }}
    >
      <div className="flex items-center h-full gap-1 px-3">
        {/* Live badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mr-3 pr-3"
          style={{ borderRight: "1px solid var(--border-1)" }}>
          {live
            ? <><span className="live-dot" style={{ width: 5, height: 5 }} /><span className="text-xs font-bold" style={{ color: "var(--green)" }}>LIVE</span></>
            : <span className="text-xs font-bold" style={{ color: "var(--t-3)" }}>SoSoValue</span>
          }
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="ticker-inner">
            {doubled.map((item, i) => (
              <TickerItem key={i} item={item} isEtf={item.symbol === "BTC ETF"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
