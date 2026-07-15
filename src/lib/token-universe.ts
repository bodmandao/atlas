// The fixed set of tokens the AI is allowed to select for a basket. This is
// also the exact set the price-history pipeline tracks daily — kept as one
// shared list so the AI can never select a token we have no price history
// for, and the checkpoint resolver never has to guess what to fetch.
export const TOKEN_UNIVERSE = [
  "BTC", "ETH", "SOL", "BNB", "ARB", "OP", "LINK", "AAVE", "UNI", "COMP",
  "SNX", "MKR", "INJ", "DYDX", "GMX", "RENDER", "TAO", "FET", "OCEAN", "WLD",
  "NEAR", "DOT", "AVAX", "ATOM", "TIA", "MATIC", "LDO", "RPL", "PENDLE", "STX",
  "ICP", "BLUR", "MAGIC", "APT", "SUI", "SEI", "PYTH", "JTO", "MANTA", "ALT",
] as const;
