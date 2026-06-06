import { NextRequest, NextResponse } from "next/server";
import type { IndexProposal } from "@/lib/types";

const hex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const makeTxHash = () => `0x${hex(64)}`;

export async function POST(req: NextRequest) {
  try {
    const { proposal }: { proposal: IndexProposal } = await req.json();

    const legs = proposal.tokens.map((t) => {
      const usd = (t.weight / 100) * proposal.totalValue;
      const slipBps = Math.round(Math.random() * 12 + 2);
      const fillPrice = +(t.price * (1 + slipBps / 10000)).toFixed(6);
      return {
        symbol: t.symbol,
        market: `${t.symbol}-USDC`,
        usdAmount: +usd.toFixed(2),
        filledQty: +(usd / fillPrice).toFixed(6),
        estimatedPrice: t.price,
        fillPrice,
        slippageBps: slipBps,
        status: "filled",
        txHash: makeTxHash(),
      };
    });

    const totalFees = +(proposal.totalValue * 0.001).toFixed(2);
    const totalSlippage = +legs
      .reduce((s, l) => s + l.usdAmount * (l.slippageBps / 10000), 0)
      .toFixed(2);

    return NextResponse.json({
      success: true,
      bundleTxHash: makeTxHash(),
      legs,
      executedAt: new Date().toISOString(),
      network: "SoDEX Testnet",
      totalValue: proposal.totalValue,
      totalFees,
      totalSlippage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Execution failed" },
      { status: 500 }
    );
  }
}
