import { NextResponse } from "next/server";
import { getPublishedIndexes } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ indexes: await getPublishedIndexes() });
}
