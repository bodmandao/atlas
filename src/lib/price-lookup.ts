import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "./db/client";
import { priceHistory } from "./db/schema";

// The snapshot cron runs at most once a day and can be delayed or missed, so
// a lookup for "the price on date X" tolerates the nearest available date up
// to `toleranceDays` earlier — never a later date (that would leak future
// information into a return calculation) and never fabricated.
export async function getPriceOnOrBefore(
  symbol: string,
  dateStr: string,
  toleranceDays = 3
): Promise<number | null> {
  const [row] = await db
    .select()
    .from(priceHistory)
    .where(and(eq(priceHistory.symbol, symbol), lte(priceHistory.date, dateStr)))
    .orderBy(desc(priceHistory.date))
    .limit(1);

  if (!row) return null;

  const gapDays = Math.floor(
    (new Date(dateStr).getTime() - new Date(row.date).getTime()) / 86_400_000
  );
  if (gapDays > toleranceDays) return null;

  return Number(row.close);
}

export function toDateOnly(d: Date): string {
  return d.toISOString().split("T")[0];
}
