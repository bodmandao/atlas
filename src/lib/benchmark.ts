// Only 5 of Atlas's 10 sectors have a SoSoValue SSI composite to benchmark
// against. Sectors without one (GameFi, Infrastructure, Privacy, Meme,
// Stablecoin) are excluded and the remaining mapped weight is renormalized —
// never silently assigned to the nearest sector, which would misrepresent
// the benchmark.
export const SECTOR_TO_SSI_TICKER: Record<string, string> = {
  DeFi: "ssiDeFi",
  AI: "ssiAI",
  Layer1: "ssiLayer1",
  Layer2: "ssiLayer2",
  RWA: "ssiRWA",
};

export interface BenchmarkComposition {
  sectorWeights: Record<string, number>; // ticker -> renormalized weight (0-1)
  unmappedWeight: number; // fraction of the basket excluded, 0-1
  available: boolean;
}

export function computeBenchmarkComposition(
  tokens: { sector: string; weight: number }[]
): BenchmarkComposition {
  const bySector: Record<string, number> = {};
  for (const t of tokens) {
    bySector[t.sector] = (bySector[t.sector] ?? 0) + t.weight;
  }

  const mapped: Record<string, number> = {};
  let mappedTotal = 0;
  for (const [sector, weight] of Object.entries(bySector)) {
    const ticker = SECTOR_TO_SSI_TICKER[sector];
    if (!ticker) continue;
    mapped[ticker] = (mapped[ticker] ?? 0) + weight;
    mappedTotal += weight;
  }

  if (mappedTotal === 0) {
    return { sectorWeights: {}, unmappedWeight: 1, available: false };
  }

  const sectorWeights: Record<string, number> = {};
  for (const [ticker, weight] of Object.entries(mapped)) {
    sectorWeights[ticker] = weight / mappedTotal;
  }

  return { sectorWeights, unmappedWeight: 1 - mappedTotal / 100, available: true };
}
