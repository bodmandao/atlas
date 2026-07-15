import { NextRequest, NextResponse } from "next/server";
import { backfillBinanceDaily } from "@/lib/price-backfill-binance";
import { TOKEN_UNIVERSE } from "@/lib/token-universe";

// Manually triggered, not on the cron schedule — a one-off best-effort
// backfill so the ledger doesn't show "insufficient_data" for every
// checkpoint through most of the judging window.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { days = 30 } = await req.json().catch(() => ({}));
  const results = await backfillBinanceDaily([...TOKEN_UNIVERSE], days);

  return NextResponse.json({
    results,
    summary: {
      ok: results.filter((r) => !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
    },
  });
}
