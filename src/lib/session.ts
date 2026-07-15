import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  address: string;
  chainId: number;
  issuedAt: number;
  expiresAt: number;
}

export interface NonceData {
  nonce: string;
  expiresAt: number;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days, hard expiry, no sliding refresh
const NONCE_TTL_SECONDS = 60 * 10; // 10 minutes — long enough to sign, short enough to bound replay

// Read lazily inside each call, never at module load: Next.js evaluates route
// modules during `next build`'s page-data collection, and an eager throw on
// a missing env var here would break the build the same way it did for the
// DB client earlier this session (src/lib/db/client.ts).
function requirePassword(): string {
  const secret = process.env.ATLAS_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ATLAS_SESSION_SECRET is not set. Generate one with `openssl rand -hex 32`."
    );
  }
  return secret;
}

// `secure` must not be hardcoded either direction — true breaks local
// `next dev` over http, false would be wrong in production.
function baseCookieOptions() {
  return { secure: process.env.NODE_ENV === "production" };
}

function sessionOptions(): SessionOptions {
  return {
    cookieName: "atlas_session",
    password: requirePassword(),
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: baseCookieOptions(),
  };
}

function nonceOptions(): SessionOptions {
  return {
    cookieName: "atlas_siwe_nonce",
    password: requirePassword(),
    ttl: NONCE_TTL_SECONDS,
    cookieOptions: baseCookieOptions(),
  };
}

export async function getSession() {
  return getIronSession<Partial<SessionData>>(await cookies(), sessionOptions());
}

export async function getNonceSession() {
  return getIronSession<Partial<NonceData>>(await cookies(), nonceOptions());
}
