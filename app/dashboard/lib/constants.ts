export const SUPPORTED_ASSETS = [
  "THB", "USDT", "USDC", "BTC", "ETH", "BNB", "SOL", "AVAX",
  "ADA", "DOT", "DOGE", "XRP", "NEAR", "ORDI", "MOODENG", "GOAT",
  "AVEX", "SATS"
];

export const EXCHANGES_MAPPED = [
  { id: "BINANCE_TH", label: "Binance TH", icon: "/coins/BINANCE-EX.png", color: "#F0B90B" },
  { id: "BITKUB", label: "Bitkub", icon: "/coins/BITKUB-EX.png", color: "#00D4AA" },
  { id: "OKX", label: "OKX", icon: "/coins/OKX_logo.svg.png", color: "#000000" },
  { id: "METAMASK", label: "MetaMask", icon: "/coins/METAMASK.png", color: "#E2761B" },
  { id: "LEDGER", label: "Ledger", icon: "/coins/LEDGER.png", color: "#FFFFFF" },
  { id: "CUSTOM", label: "Custom", icon: "/coins/CUSTOM.png", color: "#00F5FF" }
];

export const PRICE_SOURCE_MAP: Record<string, string> = {
  "BINANCE_TH": "binance",
  "BITKUB": "bitkub",
  "OKX": "okx",
  "CUSTOM": "coingecko",
  "METAMASK": "coingecko",
  "LEDGER": "coingecko",
};

export const NEON_COLORS = [
  "#00F5FF", "#FF00FF", "#BF00FF", "#00FF9F", "#FFFF00", "#FF6600"
];

export interface MarketData {
  binance: Record<string, number>;
  bitkub: Record<string, number>;
  okx: Record<string, number>;
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

export function getPriceKey(exchangeType: string): keyof MarketData {
  return (PRICE_SOURCE_MAP[exchangeType] || "binance") as keyof MarketData;
}
