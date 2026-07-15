import {
  pgTable,
  text,
  jsonb,
  boolean,
  numeric,
  integer,
  timestamp,
  bigserial,
  date,
  unique,
} from "drizzle-orm/pg-core";

// ── Theses ────────────────────────────────────────────────────────────────
// The immutable record of what the AI generated. canonicalHash is computed
// once, at insert time, over the full input/output snapshot — this is what
// makes a published thesis provably un-editable after the fact.

export const theses = pgTable("theses", {
  id: text("id").primaryKey(),
  creatorHandle: text("creator_handle").notNull(),
  creatorName: text("creator_name"),
  thesisText: text("thesis_text").notNull(),
  riskLevel: text("risk_level").notNull(),
  investAmount: numeric("invest_amount").notNull(),
  inputSnapshot: jsonb("input_snapshot").notNull(),
  rawAiOutput: jsonb("raw_ai_output").notNull(),
  proposal: jsonb("proposal").notNull(),
  predictedReturn: text("predicted_return").notNull(),
  dataSourceLive: boolean("data_source_live").notNull(),
  canonicalHash: text("canonical_hash").notNull(),
  status: text("status").notNull().default("draft"), // draft | published | archived
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  // Denormalized from verification_runs (same precedent as published_indexes'
  // perf7d/perf30d) so list pages don't need a join per row. verification_runs
  // stays append-only as the source of truth / audit trail; these two columns
  // just mirror the latest run for cheap rendering.
  latestVerificationScore: integer("latest_verification_score"),
  latestVerificationStatus: text("latest_verification_status"), // pending | completed | failed | null
});

// ── Verification runs ────────────────────────────────────────────────────
// Append-only audit trail (a re-verify creates a new row, never overwrites
// one) of the rigor check that runs at publish time. The score here is
// computed deterministically in src/lib/verifier.ts from structured tool
// results — never a number the model asserts about itself.

export const verificationRuns = pgTable("verification_runs", {
  id: text("id").primaryKey(),
  thesisId: text("thesis_id")
    .notNull()
    .references(() => theses.id),
  status: text("status").notNull(), // completed | failed
  score: integer("score"), // 0-100; null when status = 'failed'
  findings: jsonb("findings"), // [{check, passed, severity, message, penalty}]
  toolCalls: jsonb("tool_calls"), // [{turn, name, input, result}] — full audit trail
  summary: text("summary"), // model's free-text findings narrative
  model: text("model").notNull(),
  errorMessage: text("error_message"),
  triggeredBy: text("triggered_by").notNull().default("publish"), // publish | manual
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Checkpoints ──────────────────────────────────────────────────────────
// One row per (thesis, horizon). Idempotent resolution via the unique
// constraint — a cron re-run can never double-resolve or double-count.

export const thesisCheckpoints = pgTable(
  "thesis_checkpoints",
  {
    id: text("id").primaryKey(),
    thesisId: text("thesis_id")
      .notNull()
      .references(() => theses.id),
    horizon: text("horizon").notNull(), // 't+1d' | 't+3d' | 't+7d' | 't+30d'
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("pending"), // pending | resolved | insufficient_data
    realizedBasketReturn: numeric("realized_basket_return"),
    realizedBenchmarkReturn: numeric("realized_benchmark_return"),
    benchmarkComposition: jsonb("benchmark_composition"),
    missingSymbols: jsonb("missing_symbols"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [unique("thesis_checkpoints_thesis_horizon_unique").on(t.thesisId, t.horizon)]
);

// ── Price history ────────────────────────────────────────────────────────
// Real daily snapshots only — never fabricated. `source` distinguishes a
// forward-collected SoSoValue snapshot from a best-effort Binance backfill.

export const priceHistory = pgTable(
  "price_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    symbol: text("symbol").notNull(),
    date: date("date").notNull(),
    close: numeric("close").notNull(),
    source: text("source").notNull(), // 'sosovalue' | 'binance'
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("price_history_symbol_date_unique").on(t.symbol, t.date)]
);

// ── Published indexes ───────────────────────────────────────────────────
// Replaces store.ts's in-memory _store. perf7d/perf30d are nullable —
// they stay null (rendered "Pending T+7d") until a checkpoint actually
// resolves, never hardcoded to 0.

export const publishedIndexes = pgTable("published_indexes", {
  id: text("id").primaryKey(),
  thesisId: text("thesis_id")
    .notNull()
    .references(() => theses.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  thesisText: text("thesis_text").notNull(),
  sector: text("sector").notNull(),
  riskLevel: text("risk_level").notNull(),
  aiConfidence: integer("ai_confidence").notNull(),
  creatorHandle: text("creator_handle").notNull(),
  creatorName: text("creator_name"),
  tokens: jsonb("tokens").notNull(), // string[]
  canonicalHash: text("canonical_hash").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  aum: numeric("aum").notNull(),
  subscribers: integer("subscribers").notNull().default(1),
  perf7d: numeric("perf_7d"),
  perf30d: numeric("perf_30d"),
});

// ── Portfolio positions ─────────────────────────────────────────────────
// Replaces store.ts's in-memory _portfolio. `simulated`/`simulatedReason`
// make a fabricated fill impossible to mistake for a real testnet order.

export const portfolioPositions = pgTable("portfolio_positions", {
  id: text("id").primaryKey(), // = bundleTxHash
  indexName: text("index_name").notNull(),
  indexId: text("index_id"),
  thesisId: text("thesis_id").references(() => theses.id),
  allocatedUsd: numeric("allocated_usd").notNull(),
  bundleTxHash: text("bundle_tx_hash").notNull(),
  network: text("network").notNull(),
  live: boolean("live").notNull(),
  simulated: boolean("simulated").notNull().default(true),
  simulatedReason: text("simulated_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  tokens: jsonb("tokens").notNull(), // PortfolioToken[]
});
