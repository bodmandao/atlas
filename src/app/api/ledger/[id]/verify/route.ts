import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { verificationRuns } from "@/lib/db/schema";
import { runVerification } from "@/lib/verifier";

const COOLDOWN_MS = 60_000;

// Unauthenticated, matching every other write endpoint in this app (there is
// no user/session system anywhere in the codebase). The real protection
// against cost abuse is the per-thesis cooldown below, not an auth check.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [lastRun] = await db
    .select({ createdAt: verificationRuns.createdAt })
    .from(verificationRuns)
    .where(eq(verificationRuns.thesisId, id))
    .orderBy(desc(verificationRuns.createdAt))
    .limit(1);

  if (lastRun && Date.now() - lastRun.createdAt.getTime() < COOLDOWN_MS) {
    const retryAfterMs = COOLDOWN_MS - (Date.now() - lastRun.createdAt.getTime());
    return NextResponse.json(
      { error: `Re-verification is rate-limited — try again in ${Math.ceil(retryAfterMs / 1000)}s` },
      { status: 429 }
    );
  }

  const result = await runVerification(id, { triggeredBy: "manual" });
  if (result.status === "failed") {
    return NextResponse.json({ error: result.errorMessage ?? "Verification failed" }, { status: 500 });
  }
  return NextResponse.json(result);
}
