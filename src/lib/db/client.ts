import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

// The Neon HTTP driver does one fetch per query with no retry of its own.
// Transient network failures (a dropped connection, a DNS hiccup) otherwise
// surface directly as a 500 to the client instead of the driver just trying
// again. Three attempts with a short backoff, only on network-level
// failures — HTTP error responses (bad SQL, auth failures) are not retried,
// since retrying those would just repeat the same error slower.
async function retryingFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  throw new Error("unreachable");
}

// Lazy on purpose: Next.js evaluates route modules during `next build`'s
// page-data collection, before any request-time env vars are guaranteed to
// be meaningful. Connecting eagerly at import time broke the build for every
// route that imports `db`, even ones that never run at build time. Deferring
// the connection (and the missing-DATABASE_URL error) until the first real
// query keeps the build green and still fails loudly the moment a route
// actually needs the database.
function getDb(): Db {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string."
      );
    }
    neonConfig.fetchFunction = retryingFetch;
    _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return _db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
