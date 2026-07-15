import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { getSession, getNonceSession, type SessionData } from "@/lib/session";

const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000; // 7 days

// Domain is derived from the request's Host header, not a hardcoded env var
// — a hardcoded domain would fail SIWE's domain-binding check on every
// Vercel preview-deployment URL, each of which gets a unique hostname.
export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (typeof message !== "string" || typeof signature !== "string") {
      return NextResponse.json({ error: "message and signature are required" }, { status: 400 });
    }

    const nonceSession = await getNonceSession();
    if (!nonceSession.nonce || !nonceSession.expiresAt || nonceSession.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: "No valid sign-in request found — request a new nonce and try again" },
        { status: 401 }
      );
    }

    const siweMessage = new SiweMessage(message);
    const domain = req.headers.get("host") ?? "";

    const result = await siweMessage.verify({
      signature,
      domain,
      nonce: nonceSession.nonce,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.type ?? "Signature verification failed" },
        { status: 401 }
      );
    }

    // Single-use: destroying the nonce cookie now means this exact sign-in
    // request can never be replayed, regardless of what happens to the
    // signature itself.
    nonceSession.destroy();

    const session = await getSession();
    const now = Date.now();
    const data: SessionData = {
      address: result.data.address,
      chainId: result.data.chainId,
      issuedAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    Object.assign(session, data);
    await session.save();

    return NextResponse.json({ success: true, address: result.data.address });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 401 }
    );
  }
}
