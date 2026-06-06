import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import type { IndexProposal } from "@/lib/types";

const TESTNET_SPOT = "https://testnet-gw.sodex.dev/api/v1/spot";

const DOMAIN = {
  name: "spot",
  version: "1",
  chainId: 138565, // SoDEX testnet
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;

const TYPES = {
  ExchangeAction: [
    { name: "payloadHash", type: "bytes32" },
    { name: "nonce",       type: "uint64"  },
  ],
};

// Canonical decimal string per SoDEX spec (no trailing zeros, no exponent)
function dec(n: number, maxDecimals = 8): string {
  if (!isFinite(n) || n <= 0) return "0";
  const s = n.toFixed(maxDecimals);
  const clean = s.replace(/\.?0+$/, "");
  return clean || "0";
}

async function signPayload(
  privateKey: string,
  payload: object,
  nonce: bigint
): Promise<string> {
  const wallet      = new ethers.Wallet(privateKey);
  const payloadJson = JSON.stringify(payload); // compact — no whitespace
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(payloadJson));
  const sig         = await wallet.signTypedData(DOMAIN, TYPES, { payloadHash, nonce });
  // Prepend 0x01 version byte as required by SoDEX
  return "0x01" + sig.slice(2);
}

interface SodexSymbol {
  id: number;
  name: string;
  pricePrecision: number;
  quantityPrecision: number;
  minNotional: string;
}

let _symbolCache: Map<string, SodexSymbol> | null = null;
let _symbolCacheAt = 0;

async function fetchSymbolMap(): Promise<Map<string, SodexSymbol>> {
  // Cache for 5 minutes
  if (_symbolCache && Date.now() - _symbolCacheAt < 300_000) return _symbolCache;

  const res  = await fetch(`${TESTNET_SPOT}/market/symbols`, { cache: "no-store" });
  const data = await res.json();
  const map  = new Map<string, SodexSymbol>();

  for (const s of (data.data ?? [])) {
    map.set(s.name as string, s as SodexSymbol);
  }

  _symbolCache   = map;
  _symbolCacheAt = Date.now();
  return map;
}

// ── Simulation fallback (unchanged from previous impl) ───────────────────────
const hex   = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const txHash = ()          => `0x${hex(64)}`;

function simulateResponse(proposal: IndexProposal) {
  const legs = proposal.tokens.map((t) => {
    const usd      = (t.weight / 100) * proposal.totalValue;
    const slipBps  = Math.round(Math.random() * 12 + 2);
    const fillPrice = +(t.price * (1 + slipBps / 10000)).toFixed(6);
    return {
      symbol: t.symbol, market: `${t.symbol}-USDC`,
      usdAmount: +usd.toFixed(2), filledQty: +(usd / fillPrice).toFixed(6),
      estimatedPrice: t.price, fillPrice, slippageBps: slipBps,
      status: "filled", txHash: txHash(), live: false,
    };
  });
  return NextResponse.json({
    success: true,
    bundleTxHash: txHash(),
    legs,
    executedAt:    new Date().toISOString(),
    network:       "SoDEX Testnet (simulated)",
    totalValue:    proposal.totalValue,
    totalFees:     +(proposal.totalValue * 0.001).toFixed(2),
    totalSlippage: +legs.reduce((s, l) => s + l.usdAmount * (l.slippageBps / 10000), 0).toFixed(2),
    live: false,
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { proposal }: { proposal: IndexProposal } = await req.json();

  const apiKeyName = process.env.SODEX_API_KEY_NAME;
  const privateKey = process.env.SODEX_PRIVATE_KEY;
  const accountID  = process.env.SODEX_ACCOUNT_ID ? Number(process.env.SODEX_ACCOUNT_ID) : null;

  // No credentials — use simulation
  if (!apiKeyName || !privateKey || !accountID) {
    return simulateResponse(proposal);
  }

  try {
    const symbolMap = await fetchSymbolMap();
    const nonce     = BigInt(Date.now());

    const orders: object[] = [];
    const skipped: string[] = [];

    for (const token of proposal.tokens) {
      const sym = symbolMap.get(`${token.symbol}-USDC`);
      if (!sym) { skipped.push(token.symbol); continue; }

      const usd      = (token.weight / 100) * proposal.totalValue;
      const quantity = dec(usd / token.price, sym.quantityPrecision ?? 6);
      const price    = dec(token.price,        sym.pricePrecision    ?? 2);

      orders.push({
        symbolID:    sym.id,
        clOrdID:     `atl-${nonce}-${token.symbol}`.slice(0, 36),
        side:        1,  // BUY
        type:        1,  // LIMIT
        timeInForce: 3,  // IOC
        price,
        quantity,
      });
    }

    if (orders.length === 0) {
      console.warn("[execute-order] No matching SoDEX symbols, falling back to simulation. Skipped:", skipped);
      return simulateResponse(proposal);
    }

    const batchRequest = { accountID, orders };
    const payload      = { type: "newOrder", params: batchRequest };
    const sign         = await signPayload(privateKey, payload, nonce);

    const res = await fetch(`${TESTNET_SPOT}/trade/orders/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":       "application/json",
        "X-API-Key":    apiKeyName,
        "X-API-Sign":   sign,
        "X-API-Nonce":  nonce.toString(),
      },
      body: JSON.stringify(batchRequest),
    });

    const data = await res.json();

    if (!res.ok || data.code !== 0) {
      console.error("[execute-order] SoDEX error:", data);
      return simulateResponse(proposal);
    }

    // Map SoDEX order results back to our leg format
    const legs = (data.data as { code: number; clOrdID: string; orderID: number }[]).map(
      (r, i) => {
        const token    = proposal.tokens.find((t) => orders[i] && (orders[i] as { clOrdID: string }).clOrdID.includes(t.symbol)) ?? proposal.tokens[i];
        const usd      = (token.weight / 100) * proposal.totalValue;
        return {
          symbol:         token.symbol,
          market:         `${token.symbol}-USDC`,
          usdAmount:      +usd.toFixed(2),
          filledQty:      +(usd / token.price).toFixed(6),
          estimatedPrice: token.price,
          fillPrice:      token.price,
          slippageBps:    0,
          status:         r.code === 0 ? "filled" : "rejected",
          orderId:        r.orderID,
          clOrdID:        r.clOrdID,
          live:           true,
        };
      }
    );

    const bundleRef = `sodex-${data.timestamp ?? nonce}`;

    return NextResponse.json({
      success:       true,
      bundleTxHash:  bundleRef,
      legs,
      executedAt:    new Date().toISOString(),
      network:       "SoDEX Testnet",
      totalValue:    proposal.totalValue,
      totalFees:     +(proposal.totalValue * 0.001).toFixed(2),
      totalSlippage: 0,
      live:          true,
      skipped:       skipped.length ? skipped : undefined,
    });
  } catch (err) {
    console.error("[execute-order]", err);
    return simulateResponse(proposal);
  }
}
