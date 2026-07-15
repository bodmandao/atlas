import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { addPublishedIndex } from "@/lib/store";
import { db } from "@/lib/db/client";
import { theses, thesisCheckpoints } from "@/lib/db/schema";
import { runVerification } from "@/lib/verifier";

const CHECKPOINT_HORIZONS: { horizon: string; ms: number }[] = [
  { horizon: "t+1d", ms: 1 * 24 * 60 * 60 * 1000 },
  { horizon: "t+3d", ms: 3 * 24 * 60 * 60 * 1000 },
  { horizon: "t+7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { horizon: "t+30d", ms: 30 * 24 * 60 * 60 * 1000 },
];

export async function POST(req: NextRequest) {
  try {
    const { thesisId, creatorHandle, creatorName } = await req.json();

    if (!thesisId || typeof thesisId !== "string") {
      return NextResponse.json({ error: "thesisId is required" }, { status: 400 });
    }
    if (!creatorHandle || typeof creatorHandle !== "string") {
      return NextResponse.json({ error: "creatorHandle is required" }, { status: 400 });
    }

    // addPublishedIndex looks up the thesis row itself and rejects anything
    // that isn't a genuine, previously-persisted draft — a client can no
    // longer publish arbitrary hand-edited proposal JSON.
    const stored = await addPublishedIndex({ thesisId, creatorHandle, creatorName });

    await db.insert(thesisCheckpoints).values(
      CHECKPOINT_HORIZONS.map(({ horizon, ms }) => ({
        id: crypto.randomUUID(),
        thesisId,
        horizon,
        dueAt: new Date(stored.publishedAt + ms),
        status: "pending" as const,
      }))
    );

    // Rigor verification runs after the response is sent — it must never add
    // latency to the publish click. Flip to 'pending' now (before returning)
    // so the ledger shows "Verifying…" on the very next fetch instead of a
    // blank state for however long the LLM call takes.
    await db
      .update(theses)
      .set({ latestVerificationStatus: "pending" })
      .where(eq(theses.id, thesisId));

    after(() =>
      runVerification(thesisId).catch((err) => {
        console.error("[verify-after-publish]", thesisId, err);
      })
    );

    return NextResponse.json({ success: true, index: stored, canonicalHash: stored.canonicalHash });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
