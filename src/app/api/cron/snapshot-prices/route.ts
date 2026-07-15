import { NextRequest, NextResponse } from "next/server";
import { getMarketDataWithMeta, getSSIIndexesWithMeta } from "@/lib/sosovalue";
import { TOKEN_UNIVERSE } from "@/lib/token-universe";
import { db } from "@/lib/db/client";
import { priceHistory } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function upsertPrice(symbol: string, date: string, price: number) {
  await db
    .insert(priceHistory)
    .values({ symbol, date, close: String(price), source: "sosovalue" })
    .onConflictDoUpdate({
      target: [priceHistory.symbol, priceHistory.date],
      set: { close: String(price), capturedAt: sql`now()` },
    });
}

// Real daily snapshots only, going forward — never fabricated. SoSoValue's
// market-snapshot endpoint is current-only, so `close` here is an
// approximation of a daily close (whatever price it is when this cron
// fires), not a true UTC-midnight close. That imprecision is stated in the
// ledger's methodology copy rather than hidden.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const [tokenResult, ssiResult] = await Promise.all([
    getMarketDataWithMeta([...TOKEN_UNIVERSE]),
    // SSI index levels are snapshotted under their own ticker (e.g.
    // "ssiDeFi") in the same price_history table as tokens — the benchmark
    // resolver looks these up exactly like any other symbol, so it never
    // depends on SoSoValue's constituents endpoint at resolution time.
    getSSIIndexesWithMeta(),
  ]);

  // A total-failure fallback returns mock data shaped like the real thing —
  // fine for keeping the builder demo-able, but writing it into price_history
  // would silently poison every checkpoint that reads it later as if it were
  // a genuine realized price. Skip persisting entirely rather than record a
  // fabricated snapshot; the next cron run tries again with fresh data.
  let written = 0;
  if (tokenResult.live) {
    for (const d of tokenResult.data) {
      if (!d.price || d.price <= 0) continue;
      await upsertPrice(d.currencyCode, today, d.price);
      written++;
    }
  }
  if (ssiResult.live) {
    for (const idx of ssiResult.data) {
      if (!idx.indexValue || idx.indexValue <= 0) continue;
      await upsertPrice(idx.indexCode, today, idx.indexValue);
      written++;
    }
  }

  return NextResponse.json({
    date: today,
    requested: TOKEN_UNIVERSE.length + ssiResult.data.length,
    written,
    tokensLive: tokenResult.live,
    ssiLive: ssiResult.live,
  });
}
