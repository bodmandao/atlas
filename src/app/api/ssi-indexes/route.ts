import { NextResponse } from "next/server";
import { getSSIIndexes } from "@/lib/sosovalue";

export const revalidate = 120;

export async function GET() {
  const indexes = await getSSIIndexes();
  return NextResponse.json({ indexes });
}
