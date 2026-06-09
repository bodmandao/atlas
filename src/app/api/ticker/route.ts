import { NextResponse } from "next/server";
import { getSSIIndexes, getBTCETFSummary } from "@/lib/sosovalue";

export const revalidate = 60;

export async function GET() {
  console.log("[ticker] fetching SSI indexes + ETF data...");
  try {
    const [ssiIndexes, etfData] = await Promise.all([
      getSSIIndexes(),
      getBTCETFSummary(),
    ]);

    console.log(`[ticker] SSI indexes received: ${ssiIndexes.length}`);
    console.log("[ticker] SSI raw:", JSON.stringify(ssiIndexes.map((s) => ({ code: s.indexCode, value: s.indexValue, change: s.changePercent }))));
    console.log(`[ticker] ETF records received: ${etfData.length}`);
    if (etfData[0]) console.log("[ticker] ETF[0]:", JSON.stringify(etfData[0]));

    const SECTOR_LABEL: Record<string, string> = {
      ssiDeFi:    "SSI DeFi",
      ssiAI:      "SSI AI",
      ssiLayer1:  "SSI L1",
      ssiLayer2:  "SSI L2",
      ssiRWA:     "SSI RWA",
    };

    const items = ssiIndexes.map((idx) => ({
      symbol: SECTOR_LABEL[idx.indexCode] ?? idx.indexCode,
      price:  +idx.indexValue.toFixed(3),
      change: +idx.changePercent.toFixed(2),
    }));

    if (etfData[0]) {
      items.unshift({
        symbol: "BTC ETF",
        price:  +(etfData[0].totalNetAssets / 1e9).toFixed(2),
        change: etfData[0].totalNetInflow >= 0 ? 1 : -1,
      });
    }

    console.log("[ticker] responding with items:", JSON.stringify(items));
    return NextResponse.json({ items, live: true });
  } catch (err) {
    console.error("[ticker] error:", err);
    return NextResponse.json({ items: [], live: false });
  }
}
