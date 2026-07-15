import { NextResponse } from "next/server";
import { getPortfolioPositions } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ positions: await getPortfolioPositions() });
}
