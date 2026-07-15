import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { theses, thesisCheckpoints, publishedIndexes, verificationRuns } from "@/lib/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [thesisRow] = await db.select().from(theses).where(eq(theses.id, id));
  if (!thesisRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [checkpoints, [pub], [latestRun]] = await Promise.all([
    db.select().from(thesisCheckpoints).where(eq(thesisCheckpoints.thesisId, id)),
    db.select().from(publishedIndexes).where(eq(publishedIndexes.thesisId, id)),
    db
      .select()
      .from(verificationRuns)
      .where(eq(verificationRuns.thesisId, id))
      .orderBy(desc(verificationRuns.createdAt))
      .limit(1),
  ]);

  const verification = latestRun
    ? {
        status: latestRun.status,
        score: latestRun.score,
        findings: latestRun.findings,
        toolCalls: latestRun.toolCalls,
        summary: latestRun.summary,
        model: latestRun.model,
        errorMessage: latestRun.errorMessage,
        createdAt: latestRun.createdAt.getTime(),
      }
    : thesisRow.latestVerificationStatus === "pending"
      ? { status: "pending" as const }
      : null;

  return NextResponse.json({
    thesisId: thesisRow.id,
    name: pub?.name,
    thesisText: thesisRow.thesisText,
    creator: pub?.creatorName ?? pub?.creatorHandle ?? thesisRow.creatorName ?? thesisRow.creatorHandle,
    status: thesisRow.status,
    canonicalHash: thesisRow.canonicalHash,
    createdAt: thesisRow.createdAt.getTime(),
    publishedAt: thesisRow.publishedAt?.getTime() ?? null,
    dataSourceLive: thesisRow.dataSourceLive,
    predictedReturn: thesisRow.predictedReturn,
    proposal: thesisRow.proposal,
    inputSnapshot: thesisRow.inputSnapshot,
    rawAiOutput: thesisRow.rawAiOutput,
    verification,
    checkpoints: checkpoints
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .map((c) => ({
        horizon: c.horizon,
        status: c.status,
        dueAt: c.dueAt.getTime(),
        resolvedAt: c.resolvedAt?.getTime() ?? null,
        realizedBasketReturn: c.realizedBasketReturn === null ? null : Number(c.realizedBasketReturn),
        realizedBenchmarkReturn: c.realizedBenchmarkReturn === null ? null : Number(c.realizedBenchmarkReturn),
        benchmarkComposition: c.benchmarkComposition,
        missingSymbols: c.missingSymbols,
      })),
  });
}
