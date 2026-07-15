import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { theses, thesisCheckpoints, publishedIndexes } from "@/lib/db/schema";

export async function GET() {
  const published = await db
    .select()
    .from(theses)
    .where(eq(theses.status, "published"))
    .orderBy(desc(theses.publishedAt));

  const entries = await Promise.all(
    published.map(async (t) => {
      const [checkpoints, [pub]] = await Promise.all([
        db.select().from(thesisCheckpoints).where(eq(thesisCheckpoints.thesisId, t.id)),
        db.select().from(publishedIndexes).where(eq(publishedIndexes.thesisId, t.id)),
      ]);
      const proposal = t.proposal as { name: string };
      return {
        thesisId: t.id,
        name: pub?.name ?? proposal.name,
        creator: pub?.creatorName ?? pub?.creatorHandle ?? t.creatorName ?? t.creatorHandle,
        canonicalHash: t.canonicalHash,
        publishedAt: t.publishedAt?.getTime() ?? null,
        verification: { score: t.latestVerificationScore, status: t.latestVerificationStatus },
        checkpoints: checkpoints
          .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
          .map((c) => ({
            horizon: c.horizon,
            status: c.status,
            dueAt: c.dueAt.getTime(),
            realizedBasketReturn: c.realizedBasketReturn === null ? null : Number(c.realizedBasketReturn),
            realizedBenchmarkReturn: c.realizedBenchmarkReturn === null ? null : Number(c.realizedBenchmarkReturn),
          })),
      };
    })
  );

  return NextResponse.json({ entries });
}
