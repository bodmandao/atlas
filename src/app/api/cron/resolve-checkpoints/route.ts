import { NextRequest, NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { thesisCheckpoints, theses } from "@/lib/db/schema";
import { getPriceOnOrBefore, toDateOnly } from "@/lib/price-lookup";
import { computeBenchmarkComposition } from "@/lib/benchmark";
import { updatePublishedIndexPerf } from "@/lib/store";

const STALE_GRACE_DAYS = 5; // past due_at before a still-unresolvable checkpoint is marked insufficient_data instead of retried forever

interface ProposalToken {
  symbol: string;
  sector: string;
  weight: number;
}

// Idempotent: re-running is always safe. A checkpoint already 'resolved' or
// 'insufficient_data' is a terminal state and is never touched again; a
// still-'pending' checkpoint past its due date is retried every run (so
// late-arriving price data self-heals it) until STALE_GRACE_DAYS passes.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await db
    .select()
    .from(thesisCheckpoints)
    .where(and(eq(thesisCheckpoints.status, "pending"), lte(thesisCheckpoints.dueAt, now)));

  const outcomes: { thesisId: string; horizon: string; result: string }[] = [];

  for (const checkpoint of due) {
    const [thesisRow] = await db.select().from(theses).where(eq(theses.id, checkpoint.thesisId));
    if (!thesisRow || !thesisRow.publishedAt) {
      outcomes.push({ thesisId: checkpoint.thesisId, horizon: checkpoint.horizon, result: "skipped: no published thesis row" });
      continue;
    }

    const proposal = thesisRow.proposal as { tokens: ProposalToken[] };
    const baselineDate = toDateOnly(thesisRow.publishedAt);
    const currentDate = toDateOnly(checkpoint.dueAt);

    // Basket realized return: weighted sum of each token's price change.
    const missing: string[] = [];
    let basketReturn = 0;
    for (const t of proposal.tokens) {
      const [base, cur] = await Promise.all([
        getPriceOnOrBefore(t.symbol, baselineDate),
        getPriceOnOrBefore(t.symbol, currentDate),
      ]);
      if (base === null || cur === null || base === 0) {
        missing.push(t.symbol);
        continue;
      }
      basketReturn += (t.weight / 100) * (cur / base - 1);
    }

    if (missing.length > 0) {
      const daysPastDue = Math.floor((now.getTime() - checkpoint.dueAt.getTime()) / 86_400_000);
      if (daysPastDue > STALE_GRACE_DAYS) {
        await db
          .update(thesisCheckpoints)
          .set({ status: "insufficient_data", missingSymbols: missing, resolvedAt: now })
          .where(eq(thesisCheckpoints.id, checkpoint.id));
        outcomes.push({ thesisId: checkpoint.thesisId, horizon: checkpoint.horizon, result: `insufficient_data (missing: ${missing.join(", ")})` });
      } else {
        outcomes.push({ thesisId: checkpoint.thesisId, horizon: checkpoint.horizon, result: `retry later (missing: ${missing.join(", ")})` });
      }
      continue;
    }

    // Benchmark realized return: same weighted-return math, over the SSI
    // tickers that were snapshotted daily under their own symbol (see
    // cron/snapshot-prices) — no dependency on the constituents endpoint.
    const composition = computeBenchmarkComposition(proposal.tokens);
    let benchmarkReturn: number | null = null;
    if (composition.available) {
      let sum = 0;
      let ok = true;
      for (const [ticker, weight] of Object.entries(composition.sectorWeights)) {
        const [base, cur] = await Promise.all([
          getPriceOnOrBefore(ticker, baselineDate),
          getPriceOnOrBefore(ticker, currentDate),
        ]);
        if (base === null || cur === null || base === 0) { ok = false; break; }
        sum += weight * (cur / base - 1);
      }
      benchmarkReturn = ok ? sum : null;
    }

    await db
      .update(thesisCheckpoints)
      .set({
        status: "resolved",
        realizedBasketReturn: String(basketReturn),
        realizedBenchmarkReturn: benchmarkReturn === null ? null : String(benchmarkReturn),
        benchmarkComposition: composition,
        resolvedAt: now,
      })
      .where(eq(thesisCheckpoints.id, checkpoint.id));

    if (checkpoint.horizon === "t+7d" || checkpoint.horizon === "t+30d") {
      await updatePublishedIndexPerf(checkpoint.thesisId, checkpoint.horizon, basketReturn * 100);
    }

    outcomes.push({ thesisId: checkpoint.thesisId, horizon: checkpoint.horizon, result: `resolved: ${(basketReturn * 100).toFixed(2)}% vs benchmark ${benchmarkReturn === null ? "n/a" : (benchmarkReturn * 100).toFixed(2) + "%"}` });
  }

  return NextResponse.json({ checked: due.length, outcomes });
}
