# ATLAS — Verifiable On-Chain Index Protocol

ATLAS lets anyone describe an investment thesis in plain English, have Claude construct an optimized token basket from live SoSoValue institutional data, and execute it on SoDEX. What sets Wave 3 apart from a typical AI-basket builder: every published thesis is **hash-anchored** the instant it's generated, **fact-checked** against the exact data it claims to cite, and **measured honestly** against realized market outcomes over time. Built for the **SoSoValue Hackathon**.

---

## What It Does

1. **Describe a thesis** — "AI infrastructure tokens with positive ETF inflow correlation"
2. **Get an AI-constructed basket** — Claude reads live ETF flow data, SSI sector indexes, and market news, then assembles and weights a token portfolio matching the thesis and risk profile. The moment it's generated, the full input snapshot + raw AI output + resulting proposal is hashed (keccak256) and persisted — before the user has even decided to publish it.
3. **Review every token** — weight, price, 24h change, sector, signal strength, and the AI's rationale, cited against the live data it was given
4. **Execute on SoDEX** — IOC limit orders for every leg, with per-leg slippage estimates and a mandatory confirmation gate. If testnet credentials aren't configured, the fill is explicitly labeled simulated — never indistinguishable from a real one.
5. **Publish to the Ledger** — publishing locks in the hash, kicks off a rigor check (the Verifier Agent), and schedules checkpoints that will measure the basket's realized return against a benchmark at T+1d/3d/7d/30d. Nothing about a published thesis can be edited after the fact.

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — product overview, how it works |
| `/app` | Dashboard — live BTC ETF flows, SSI sector indexes, news feed |
| `/app/builder` | AI Index Builder — thesis → AI → review → execute → publish |
| `/app/marketplace` | Marketplace — browse published indexes, each linking to its ledger record |
| `/app/ledger` | The Ledger — every published thesis, its hash, rigor score, and checkpoint status |
| `/app/ledger/[id]` | Ledger detail — full hash, AI context, verifier findings + tool-call audit trail, realized-vs-benchmark returns per checkpoint |
| `/app/portfolio` | Portfolio — executed positions, live/simulated status |
| `/app/signals` | Live Signals — scored buy/sell signals per token |
| `/app/settings` | Settings |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom design system (`globals.css`) |
| Database | Postgres via [Neon](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team) |
| AI | Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` — direct SDK, manual tool-use loop for the verifier, no agent framework |
| Market Data | SoSoValue API (ETF flows, SSI indexes, news, per-token market snapshots) |
| Execution | SoDEX testnet API (EIP-712 signed orders via `ethers`) |
| Scheduled jobs | [cron-job.org](https://cron-job.org) hitting `/api/cron/*` (any external pinger works — the routes just check a bearer secret) |
| Icons | Lucide React |
| Runtime | Node.js 22 |

---

## Project Structure

```
atlas/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing page
│   │   ├── layout.tsx / globals.css           # Root layout + design system
│   │   ├── app/                               # Authenticated app shell
│   │   │   ├── layout.tsx                     # Header + sidebar nav
│   │   │   ├── page.tsx                       # Dashboard
│   │   │   ├── builder/page.tsx                # Thesis → AI → review → execute → publish
│   │   │   ├── marketplace/page.tsx             # Published indexes + ledger links
│   │   │   ├── ledger/page.tsx                  # Ledger list
│   │   │   ├── ledger/[id]/page.tsx             # Ledger detail (hash, verifier, checkpoints)
│   │   │   ├── portfolio/page.tsx
│   │   │   ├── signals/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── build-index/route.ts            # POST — thesis → AI proposal, hash-anchors a theses row
│   │       ├── publish-index/route.ts          # POST — publish, seed checkpoints, trigger verification
│   │       ├── published-indexes/route.ts       # GET — marketplace feed
│   │       ├── execute-order/route.ts          # POST — SoDEX EIP-712 execution (or honest simulation)
│   │       ├── portfolio/route.ts              # GET
│   │       ├── ssi-indexes/route.ts / ticker/route.ts
│   │       ├── ledger/route.ts                  # GET — ledger list
│   │       ├── ledger/[id]/route.ts             # GET — ledger detail
│   │       ├── ledger/[id]/verify/route.ts      # POST — manual re-verify (60s cooldown)
│   │       ├── cron/snapshot-prices/route.ts    # GET — daily price snapshot (bearer-secured)
│   │       ├── cron/resolve-checkpoints/route.ts # GET — checkpoint resolution (bearer-secured)
│   │       └── admin/backfill-binance/route.ts  # POST — one-off historical backfill
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts                      # Drizzle schema — all 6 tables
│   │   │   └── client.ts                      # Lazy Neon connection, retrying fetch
│   │   ├── store.ts                            # Postgres-backed published indexes + portfolio positions
│   │   ├── verifier.ts                          # Rigor-check tool-use loop + deterministic scoring
│   │   ├── sosovalue.ts                        # SoSoValue client — *WithMeta variants report real live/mock status
│   │   ├── sodex.ts                             # SoDEX read-only market client
│   │   ├── benchmark.ts                         # Sector → SSI benchmark composition
│   │   ├── price-lookup.ts                      # Tolerant date-nearest price lookups
│   │   ├── price-backfill-binance.ts            # Best-effort historical backfill (no fabrication)
│   │   ├── token-universe.ts                    # The fixed 40-token universe (shared by AI + price pipeline)
│   │   ├── creator-identity.ts                  # Lightweight localStorage creator handle (no wallet yet)
│   │   ├── types.ts
│   │   └── utils.ts
│   └── components/
│       ├── BacktestChart.tsx / RadarChart.tsx
│       └── ui/{Ticker,StatCard,TokenRow}.tsx
├── drizzle.config.ts
├── .env.local                                  # Not committed — see Environment Variables below
└── package.json
```

---

## API Integrations

### SoSoValue API

Base URL: `https://openapi.sosovalue.com/openapi/v1`, header `x-soso-api-key: <SOSOVALUE_API_KEY>`.

| Endpoint | Used for |
|---|---|
| `GET /news` | News feed (dashboard, signals, build-index context) |
| `GET /etfs/summary-history` | BTC ETF net-inflow history |
| `GET /indices/{ticker}/market-snapshot` + `/constituents` | The 5 SSI sector indexes (DeFi, AI, Layer1, Layer2, RWA) |
| `GET /currencies/{symbol}/market-snapshot` | Per-token price/24h-change, used by the price-history pipeline |

Every call has a `*WithMeta` variant that reports whether it actually reached the live API or fell back to mock data — this `live` flag is what drives every "LIVE DATA" badge in the UI and is persisted onto each thesis, rather than inferred from whether an env var looks non-placeholder.

### SoDEX (testnet)

Base URL: `https://testnet-gw.sodex.dev/api/v1/spot`.

Execution (`/api/api/execute-order`) signs a batch order with EIP-712 (`ethers.Wallet.signTypedData`, keccak256 payload hash, `0x01`-prefixed signature) and posts it to SoDEX. If `SODEX_API_KEY_NAME` / `SODEX_PRIVATE_KEY` / `SODEX_ACCOUNT_ID` aren't configured, or the live call fails for any reason, the response falls back to a simulated fill — but `simulated: true` and the specific reason are always returned and rendered (amber badge), never silently indistinguishable from a real fill.

### Claude (`POST /api/build-index`)

1. Fetches live SoSoValue context (news, ETF flows, SSI indexes) via the `*WithMeta` functions
2. Builds a system prompt with the fixed 40-token universe (`src/lib/token-universe.ts`), sector/signal definitions, and per-risk-level weight constraints
3. Calls `claude-sonnet-4-6` with the thesis + live data context
4. Parses the JSON response into an `IndexProposal`
5. Hashes `{inputSnapshot, rawAiOutput, proposal, predictedReturn, createdAt}` with keccak256 and persists a `theses` row — this happens here, at generation time, specifically so the hash can never reflect anything a client added or edited later

**Risk constraints enforced in the prompt:**

| Risk Level | Max Tokens | Max Single Weight | Min Weight |
|---|---|---|---|
| Low | 8 | 25% | 5% |
| Medium | 10 | 30% | 4% |
| High | 12 | 40% | 3% |

(These exact numbers are reused — not restated — by the Verifier Agent's concentration check.)

---

## Persistence & The Ledger

Everything is Postgres now (Neon + Drizzle) — six tables, no in-memory state:

| Table | Purpose |
|---|---|
| `theses` | Every generated basket — input snapshot, raw AI output, proposal, `canonical_hash`, status, latest verification score |
| `thesis_checkpoints` | One row per (thesis, horizon) — `t+1d / t+3d / t+7d / t+30d` — realized basket return vs. a sector-blended SSI benchmark |
| `price_history` | Daily price snapshots for the token universe + the 5 SSI indices, sourced only from real SoSoValue data or a best-effort Binance backfill — a total-failure mock fallback is never persisted here, only skipped |
| `published_indexes` | The public marketplace listing, denormalized from `theses` for cheap list rendering |
| `portfolio_positions` | Executed fills, real or honestly-flagged simulated |
| `verification_runs` | Append-only audit trail of every rigor check (see below) |

**Checkpoint resolution** (`/api/cron/resolve-checkpoints`) is idempotent: due checkpoints are resolved by comparing the token-weighted realized return against the benchmark, computed purely from `price_history`. Missing price data doesn't get invented — a checkpoint stays `pending` and retries on the next run, only flipping to `insufficient_data` after a grace period.

**Scheduling**: `/api/cron/snapshot-prices` and `/api/cron/resolve-checkpoints` are plain `GET` routes checking `Authorization: Bearer <CRON_SECRET>` — triggered by [cron-job.org](https://cron-job.org) (or any scheduler that can set a custom header and hit a URL).

---

## Verifier Agent

The rigor check that runs when a thesis is published (`src/lib/verifier.ts`) — it does not predict whether the basket will be profitable, it checks whether it was constructed honestly from the data it cites.

- A Claude tool-use loop reads every token's rationale and, for each checkable claim (a cited SSI move, ETF flow figure, or news reference), calls `verify_cited_figure`, which cross-checks it against the *exact* input snapshot the builder AI saw at generation time — not re-fetched live data.
- Three structural checks — weight-sum, concentration limits, data freshness — are computed **deterministically in code** after the loop, regardless of whether the model bothered to call the matching tool. The final score is never a number the model asserts about itself.
- Zero fact-checking attempts (the model found nothing checkable, or didn't try) hard-caps the score at 40 — "unverified" is a distinct, honestly-labeled outcome from "verified and clean."
- Runs via Next.js's `after()` so it never adds latency to the publish click, and fails safely: a failed run is recorded with its error and the UI shows "verification failed," never a fabricated score.
- A manual re-verify is available from the ledger detail page, rate-limited to once per 60 seconds per thesis.

---

## Getting Started

### Prerequisites

- Node.js 18+ (developed against Node 22)
- npm 10+
- A [Neon](https://neon.tech) Postgres database (free tier is enough)

### Install

```bash
git clone https://github.com/bodmandao/atlas
cd atlas
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
SOSOVALUE_API_KEY=your_sosovalue_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required — no in-memory fallback exists anymore
DATABASE_URL=postgresql://user:password@your-neon-host/db?sslmode=require

# Required for the cron/admin routes
CRON_SECRET=any_random_string

# Optional — leave unset to use the honestly-labeled simulation fallback
# SODEX_API_KEY_NAME=
# SODEX_PRIVATE_KEY=
# SODEX_ACCOUNT_ID=
```

- **SoSoValue API key** — apply at https://forms.gle/2nuJT2qNbUQsyyZy8
- **Anthropic API key** — get at https://console.anthropic.com
- **Neon connection string** — free project at https://neon.tech; use the pooled connection string

`SOSOVALUE_API_KEY`/`ANTHROPIC_API_KEY` missing or invalid degrades to honestly-labeled mock data where possible (SoSoValue calls) or a clear error (Claude calls, which have no mock fallback). `DATABASE_URL` is not optional — the app has no in-memory persistence path anymore.

### Database

```bash
npm run db:push      # push the Drizzle schema to your Neon database
npm run db:studio    # optional — browse the database in Drizzle Studio
```

### Run

```bash
npm run dev          # development server on http://localhost:3000
npm run build        # production build
npm run start         # production server
```

### Scheduled jobs (production)

Point two cron-job.org (or equivalent) jobs at your deployed domain, both `GET`, both with header `Authorization: Bearer <CRON_SECRET>`:

- `/api/cron/snapshot-prices` — once daily
- `/api/cron/resolve-checkpoints` — shortly after, so the day's snapshot is in before checkpoints resolve against it

---

## Design System

The entire UI is built on a custom design system defined in `src/app/globals.css` — no component library.

**Color palette** — `--bg-0…--bg-3` (surface depths) · `--cyan: #00d9ff` (primary accent) · `--amber: #d4a841` · `--green: #00e676` / `--red: #ff4444` (up/down) · `--violet: #7c3aed` (AI/secondary)

**Glass system** — `.glass` / `.glass-elevated` / `.glass-inset` / `.glass-row`

**Animated border** — `.glow-border` (`@property --rot` + `conic-gradient`, no JS) · `.border-gradient` (static mask-technique variant)

**Typography** — `.text-display` · `.num-xl` / `.num-lg` (tabular numerics) · `.label-caps` · `.grad-cyan` / `.grad-amber`

**Components** — `.btn .btn-cyan/.btn-outline/.btn-ghost-sm` · `.badge .badge-cyan/amber/violet/green/red` · `.field` · `.metric-card` · `.live-dot`

---

## Data Flow

```
User types thesis
       │
       ▼
POST /api/build-index
       │
       ├── getNewsListWithMeta() / getBTCETFSummaryWithMeta() / getSSIIndexesWithMeta()
       │        → real live/mock status, not an env-var guess
       ▼
Claude (system prompt + live data context + thesis)
       │
       ▼
IndexProposal JSON  →  keccak256(inputSnapshot + rawAiOutput + proposal)
       │                        │
       │                        ▼
       │                 theses row persisted (status: draft)
       ▼
Review → ExecutionPreview → ConfirmationGate → SoDEX (or honest simulation)
       │
       ▼
Publish
       │
       ├── published_indexes row + 4 thesis_checkpoints rows (t+1d/3d/7d/30d)
       └── after() → Verifier Agent → verification_runs row + theses.latest_verification_*
                                              │
                        cron/snapshot-prices ─┤ (daily)
                        cron/resolve-checkpoints ─┘ → realized vs. benchmark, per checkpoint
                                              │
                                              ▼
                                    /app/ledger/[id]
```

---

## Data Freshness

| Source | Freshness |
|---|---|
| Dashboard ETF/SSI/news | ISR, 120s revalidate |
| `/app/signals`, `/api/ssi-indexes`, `/api/ticker` | ISR, 60s revalidate |
| Ledger, marketplace, portfolio | Client-fetched from Postgres-backed API routes — always current, not ISR |
| `price_history` | Written once daily by `cron/snapshot-prices` |
| `thesis_checkpoints` | Resolved once daily by `cron/resolve-checkpoints`, self-healing on subsequent runs if data was briefly unavailable |

---

## Hackathon Context

Built for the **SoSoValue Hackathon**, addressing the "index publisher" use case: AI-driven portfolio construction grounded in live institutional data, real execution (not just signals), and a marketplace where indexes can be published and copy-executed.

Wave 3's focus: the single most repeated critique across prior waves was the lack of a verifiable, quantitative basis for the AI's output. Rather than argue the AI is trustworthy, this wave built the infrastructure to prove or disprove it over time — hash-anchored theses that can't be edited after publish, a rigor check that fact-checks citations against real data instead of trusting them, and a checkpoint ledger that measures realized outcomes against a real benchmark instead of a synthetic backtest.
