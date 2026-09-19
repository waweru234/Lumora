export type Direction = "HIGH" | "LOW";

export type Asset = {
  symbol: string;
  display: string;
  basePrice: number;
  kind: "forex" | "crypto" | "commodity";
  decimals: number;
  spreadBps: number;
  volatility: number;
};

export const ASSETS: Asset[] = [
  { symbol: "EURUSD", display: "EUR/USD",  basePrice: 1.0864,    kind: "forex",     decimals: 5, spreadBps: 0.0001, volatility: 0.28 },
  { symbol: "GBPUSD", display: "GBP/USD",  basePrice: 1.2981,    kind: "forex",     decimals: 5, spreadBps: 0.0001, volatility: 0.32 },
  { symbol: "USDJPY", display: "USD/JPY",  basePrice: 149.34,    kind: "forex",     decimals: 3, spreadBps: 0.01,   volatility: 0.30 },
  { symbol: "BTCUSD", display: "BTC/USD",  basePrice: 63812.4,   kind: "crypto",    decimals: 2, spreadBps: 5,      volatility: 0.62 },
  { symbol: "ETHUSD", display: "ETH/USD",  basePrice: 3402.7,    kind: "crypto",    decimals: 2, spreadBps: 1,      volatility: 0.55 },
  { symbol: "XAUUSD", display: "XAU/USD",  basePrice: 2341.8,    kind: "commodity", decimals: 2, spreadBps: 0.5,    volatility: 0.40 },
];
