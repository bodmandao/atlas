# ATLAS — Thematic On-Chain Index Protocol

ATLAS is a thematic on-chain index protocol that lets anyone describe an investment thesis in plain English, have Claude AI construct an optimized token basket using live SoSoValue institutional data, and execute it directly on SoDEX. Built for the **SoSoValue Hackathon Wave 1**.

---

## What It Does

Most crypto portfolio tools either give you raw signals (buy/sell alerts) or pre-built index funds you can only passively hold. ATLAS is the missing middle layer — an **index publisher** that lets you:

1. **Describe a thesis** — "AI infrastructure tokens with positive ETF inflow correlation"
2. **Get an AI-constructed basket** — Claude reads live ETF flow data, SSI sector indexes, and market news, then assembles and weights a token portfolio that matches your thesis and risk profile
3. **Review every token** — see each token's weight, price, 24h change, sector, signal strength, and the AI's specific rationale backed by SoSoValue data
4. **Execute on SoDEX** — submit IOC limit orders for every leg of the basket in one click, with per-leg slippage estimates and a mandatory confirmation gate
5. **Publish to the Marketplace** — share your index publicly so others can copy-execute it

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — product overview, how it works, sample indexes |
| `/app` | Dashboard — live BTC ETF flows (30d), SSI sector indexes, news feed |
| `/app/builder` | AI Index Builder — 4-step flow: thesis → AI → review → execute |
| `/app/marketplace` | Index Marketplace — browse and copy-execute published indexes |
| `/app/portfolio` | Portfolio — track positions, P&L per token, rebalance suggestions |
| `/app/signals` | Live Signals — scored buy/sell signals per token from SoSoValue data |
| `/app/settings` | Settings — API keys, risk controls, notification preferences |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, ISR, Server Components) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom design system (`globals.css`) |
| AI | Claude Sonnet 4.6 via `@anthropic-ai/sdk` |
| Market Data | SoSoValue API (ETF flows, SSI indexes, news) |
| Execution | SoDEX API (markets, orderbook, IOC limit orders) |
| Icons | Lucide React |
| Runtime | Node.js 22 (via NVM) |

---

## Project Structure

```
atlas/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (client component)
│   │   ├── globals.css               # Full design system
│   │   ├── layout.tsx                # Root layout + font loading
│   │   └── app/
│   │       ├── layout.tsx            # App shell (header + sidebar)
│   │       ├── page.tsx              # Dashboard
│   │       ├── builder/page.tsx      # AI Index Builder
│   │       ├── marketplace/page.tsx  # Index Marketplace
│   │       ├── portfolio/page.tsx    # Portfolio tracker
│   │       ├── signals/page.tsx      # Live signals feed
│   │       ├── settings/page.tsx     # Settings
│   │       └── api/
│   │           └── build-index/
│   │               └── route.ts      # POST /api/build-index
│   ├── lib/
│   │   ├── sosovalue.ts              # SoSoValue API client + mock fallbacks
│   │   ├── sodex.ts                  # SoDEX API client + slippage estimator
│   │   ├── types.ts                  # Core TypeScript interfaces
│   │   └── utils.ts                  # Formatting helpers
│   └── components/
│       └── ui/
│           ├── Ticker.tsx            # Live price ticker strip
│           ├── StatCard.tsx          # Metric display card
│           └── TokenRow.tsx          # Token row component
├── .env.local                        # API keys (not committed)
├── next.config.ts
└── package.json
```

---


### Claude AI (`POST /api/build-index`)

The core AI endpoint:

1. Fetches live context from SoSoValue (ETF flows, SSI indexes, latest news headlines)
2. Constructs a structured system prompt with the full token universe (40+ tokens), sector definitions, signal types, and risk-level weight constraints
3. Passes the user's thesis + live data as the user message to `claude-sonnet-4-6`
4. Parses the JSON response into a typed `IndexProposal` object
5. Returns the proposal to the client

The model is instructed to cite specific data signals from the live context in each token's rationale — so every basket is grounded in real institutional data, not generic recommendations.

**Token universe available to the AI:**
`BTC, ETH, SOL, BNB, ARB, OP, LINK, AAVE, UNI, COMP, SNX, MKR, INJ, DYDX, GMX, RENDER, TAO, FET, OCEAN, WLD, NEAR, DOT, AVAX, ATOM, TIA, MATIC, LDO, RPL, PENDLE, STX, ICP, BLUR, MAGIC, APT, SUI, SEI, PYTH, JTO, MANTA, ALT`

**Risk constraints enforced in the prompt:**

| Risk Level | Max Tokens | Max Single Weight | Min Weight |
|---|---|---|---|
| Low (Conservative) | 8 | 25% | 5% |
| Medium (Balanced) | 10 | 30% | 4% |
| High (Aggressive) | 12 | 40% | 3% |

---

## Getting Started

### Prerequisites

- Node.js 18+ (project uses Node 22 via NVM)
- npm 10+

### Install

```bash
git clone https://github.com/bodmandao/atlas
cd atlas
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
SOSOVALUE_API_KEY=sosovalue_api_key
ANTHROPIC_API_KEY=anthropic_api_key
```

- **SoSoValue API key** — apply at https://forms.gle/2nuJT2qNbUQsyyZy8
- **Anthropic API key** — get at https://console.anthropic.com

Both keys are optional for local development — mock data is served automatically when they are missing.

### Run

```bash
npm run dev          # development server on http://localhost:3000
npm run build        # production build
npm run start        # production server
```

---

## Design System

The entire UI is built on a custom design system defined in `src/app/globals.css` — no component library. Key principles:

**Color palette**
- `--bg-0 … --bg-3` — four surface depths from near-black to card level
- `--cyan: #00d9ff` — primary brand accent (electric cyan)
- `--amber: #d4a841` — secondary accent
- `--green: #00e676` / `--red: #ff4444` — up/down indicators
- `--violet: #7c3aed` — AI / secondary highlight

**Glass system**
- `.glass` — primary panel with backdrop blur, rim lighting, and depth shadow
- `.glass-elevated` — stronger opacity for modals and overlays
- `.glass-inset` — sunken inset panel
- `.glass-row` — interactive list row with cyan hover state

**Animated border**
- `.glow-border` — CSS `@property --rot` + `conic-gradient` creates a rotating cyan/violet gradient border with no JavaScript
- `.border-gradient` — static gradient border using the mask technique for cheaper static use cases

**Typography**
- `.text-display` — hero heading (`clamp(2.8rem, 6vw, 5.5rem)`, weight 900)
- `.num-xl` / `.num-lg` — tabular-numeric metric values
- `.label-caps` — 10px uppercase tracking label
- `.grad-cyan` / `.grad-amber` — gradient text fill

**Components**
- `.btn .btn-cyan` / `.btn-outline` / `.btn-ghost-sm` — button variants
- `.badge .badge-cyan/amber/violet/green/red` — status pills
- `.field` — form input with cyan focus ring
- `.metric-card` — stat card with animated top-line highlight on hover
- `.live-dot` — pulsing green dot for live data indicators

---

## Data Flow

```
User types thesis
       │
       ▼
POST /api/build-index
       │
       ├── getNewsList()      → SoSoValue /v1/news/list
       ├── getBTCETFSummary() → SoSoValue /etfs/summary-history
       └── getSSIIndexes()    → SoSoValue /v1/indexes/list
                 │
                 ▼
       Claude Sonnet 4.6
       (system prompt + live data context + user thesis)
                 │
                 ▼
       IndexProposal JSON
       { name, tokens[], weights, signals, rationales, dataSignals }
                 │
                 ▼
       Review step (client)
       TokenCard × N with expandable AI rationale
                 │
                 ▼
       ExecutionPreview
       Orderbook walk → per-leg slippage estimate
                 │
                 ▼
       ConfirmationGate (checkbox required)
                 │
                 ▼
       SoDEX IOC limit orders (testnet)
```

---

## ISR Revalidation

Server-rendered pages use Next.js ISR to keep data fresh without full SSR costs:

| Page | Revalidate |
|---|---|
| `/app` (Dashboard) | 120 seconds |
| `/app/signals` | 60 seconds |
| All others | Static |

---

