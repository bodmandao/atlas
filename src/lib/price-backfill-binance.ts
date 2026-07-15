import { db } from "./db/client";
import { priceHistory } from "./db/schema";

interface BackfillResult {
  symbol: string;
  daysWritten: number;
  skipped?: string; // reason, if the symbol has no clean Binance pair
}

// Best-effort only: Binance's public klines endpoint needs no API key, but
// not every token in our universe has a clean {SYMBOL}USDT spot pair. Symbols
// without one are reported as skipped, never faked with synthetic data.
// ON CONFLICT DO NOTHING — a Binance backfill must never overwrite a real
// same-day snapshot already written by the forward-collecting cron.
export async function backfillBinanceDaily(symbols: string[], days = 30): Promise<BackfillResult[]> {
  const results: BackfillResult[] = [];

  for (const symbol of symbols) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&limit=${days}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        results.push({ symbol, daysWritten: 0, skipped: `Binance ${res.status} — no ${symbol}USDT pair` });
        continue;
      }
      const klines = (await res.json()) as unknown[];
      if (!Array.isArray(klines) || klines.length === 0) {
        results.push({ symbol, daysWritten: 0, skipped: "empty klines response" });
        continue;
      }

      let written = 0;
      for (const k of klines) {
        // Kline shape: [openTime, open, high, low, close, volume, closeTime, ...]
        const row = k as [number, string, string, string, string, string, number];
        const date = new Date(row[6]).toISOString().split("T")[0];
        const close = row[4];

        await db
          .insert(priceHistory)
          .values({ symbol, date, close, source: "binance" })
          .onConflictDoNothing({ target: [priceHistory.symbol, priceHistory.date] });
        written++;
      }
      results.push({ symbol, daysWritten: written });
    } catch (err) {
      results.push({ symbol, daysWritten: 0, skipped: err instanceof Error ? err.message : String(err) });
    }
  }

  return results;
}
