import { NextRequest, NextResponse } from "next/server";
import { addPublishedIndex } from "@/lib/store";
import type { IndexProposal } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { proposal }: { proposal: IndexProposal } = await req.json();
    const stored = addPublishedIndex(proposal);
    return NextResponse.json({ success: true, index: stored });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
