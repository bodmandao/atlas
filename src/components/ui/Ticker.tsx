"use client";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

const MOCK_TICKERS: TickerItem[] = [
  { symbol: "BTC", price: 97500, change: 2.3 },
  { symbol: "ETH", price: 3650, change: 1.8 },
  { symbol: "SOL", price: 182, change: 4.1 },
  { symbol: "ARB", price: 1.12, change: -1.2 },
  { symbol: "LINK", price: 18.5, change: 3.5 },
  { symbol: "AAVE", price: 285, change: 2.1 },
  { symbol: "UNI", price: 11.2, change: -0.8 },
  { symbol: "INJ", price: 32.4, change: 5.7 },
  { symbol: "RENDER", price: 8.9, change: 7.2 },
  { symbol: "TAO", price: 485, change: -2.4 },
  { symbol: "WLD", price: 3.1, change: 6.8 },
  { symbol: "FET", price: 2.8, change: 4.3 },
];

export default function Ticker() {
  const items = [...MOCK_TICKERS, ...MOCK_TICKERS];

  return (
    <div className="w-full overflow-hidden border-b" style={{ borderColor: "var(--border)", background: "rgba(13,20,33,0.95)" }}>
      <div className="flex items-center ticker-track gap-8 py-2 px-4 whitespace-nowrap">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              {item.symbol}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>
              ${item.price.toLocaleString()}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: item.change >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}
            >
              {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(1)}%
            </span>
            <span style={{ color: "var(--border-bright)" }} className="text-xs">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
