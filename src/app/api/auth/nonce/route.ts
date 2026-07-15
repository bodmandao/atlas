import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { getNonceSession } from "@/lib/session";

// The nonce lives only in this short-lived sealed cookie — never in a
// server-side Map or store. That's what makes replay protection work
// correctly across Vercel's stateless, concurrent serverless invocations
// instead of silently breaking outside of local `next dev`.
export async function GET() {
  const nonce = generateNonce();
  const nonceSession = await getNonceSession();
  nonceSession.nonce = nonce;
  nonceSession.expiresAt = Date.now() + 10 * 60 * 1000;
  await nonceSession.save();
  return NextResponse.json({ nonce });
}
