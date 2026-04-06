export const SUPPORTED_ASSETS = [
  "THB", "USDT", "USDC", "BTC", "ETH", "BNB", "SOL", "AVAX",
  "ADA", "DOT", "DOGE", "XRP", "NEAR", "ORDI", "MOODENG", "GOAT",
  "AVEX", "SATS", "TRX"
];

export const EXCHANGES_MAPPED = [
  { id: "BINANCE_TH", label: "Binance TH", icon: "/coins/BINANCE-EX.png", color: "#F0B90B" },
  { id: "BITKUB", label: "Bitkub", icon: "/coins/BITKUB-EX.png", color: "#00D4AA" },
  { id: "OKX", label: "OKX", icon: "/coins/OKX_logo.svg.png", color: "#000000" },
  { id: "METAMASK", label: "MetaMask", icon: "/coins/METAMASK.png", color: "#E2761B" },
  { id: "LEDGER", label: "Ledger", icon: "/coins/LEDGER.png", color: "#FFFFFF" },
  { id: "CUSTOM", label: "Custom", icon: "/coins/CUSTOM.png", color: "#00F5FF" }
];

// [MOVED: 2026-04-06] PRICE_SOURCE_MAP and getPriceKey moved to priceUtils.ts
// Use: import { getPriceKey, PRICE_SOURCE_MAP } from "./priceUtils";

export const NEON_COLORS = [
  "#00F5FF", "#FF00FF", "#BF00FF", "#00FF9F", "#FFFF00", "#FF6600"
];

export interface MarketData {
  binance: Record<string, number>;
  bitkub: Record<string, number>;
  okx: Record<string, number>;
  coingecko: Record<string, number>; // [ADDED: 2026-04-06]
  usdthb: number;
}

export interface PortfolioItem {
  broker: string;
  asset: string;
  amount: number;
  avgPrice?: number;
}

export interface Portfolio {
  id: string;
  dbId?: number;
  name: string;
  customName?: string;
  broker: string;
  icon: string;
  totalValue: number;
  assets: PortfolioItem[];
}

export interface DailySnapshot {
  date: string;
  totalValue: number;
  holdingsJson?: Record<string, number>;
}

export interface Transaction {
  id: number;
  broker: string;
  asset: string;
  amount: string;
  type: "DEPOSIT" | "WITHDRAW";
  price?: string;
  date: string;
  note?: string;
}

// [MOVED: 2026-04-06] getPriceKey function moved to priceUtils.ts
// Use: import { getPriceKey } from "./priceUtils";
