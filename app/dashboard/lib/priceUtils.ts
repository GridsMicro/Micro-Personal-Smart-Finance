/**
 * Price Utilities - มาตรฐานการดึงราคาเหรียญ
 * 
 * [STANDARD: 2026-04-06] ใช้ไฟล์นี้เป็นที่เดียวสำหรับ price source mapping
 * ทุกไฟล์ที่ต้องการดึงราคาให้ import จากที่นี่ ไม่กำหนดเอง
 */

/** MarketData interface - ข้อมูลราคาจาก /api/ticker */
export interface MarketData {
  binance: Record<string, number>;
  bitkub: Record<string, number>;
  okx: Record<string, number>;
  coingecko: Record<string, number>;
  usdthb?: number;
}

/**
 * Price Source Mapping - กำหนดว่าแต่ละ broker ดึงราคาจากไหน
 * 
 * - BINANCE_TH: bitkub (Binance TH API มัก return empty)
 * - BITKUB: bitkub
 * - OKX: okx
 * - CUSTOM/METAMASK/LEDGER: coingecko (global price)
 */
export const PRICE_SOURCE_MAP: Record<string, keyof MarketData> = {
  "BINANCE_TH": "bitkub",
  "BITKUB": "bitkub",
  "OKX": "okx",
  "CUSTOM": "coingecko",
  "METAMASK": "coingecko",
  "LEDGER": "coingecko",
};

/**
 * Get price lookup key from exchange_type/broker
 * @param exchangeType - BINANCE_TH, BITKUB, CUSTOM, etc.
 * @returns keyof MarketData - binance, bitkub, okx, coingecko
 */
export function getPriceKey(exchangeType: string): keyof MarketData {
  return PRICE_SOURCE_MAP[exchangeType] || "coingecko";
}

/**
 * Get price for specific asset from price data
 * @param prices - MarketData object from /api/ticker
 * @param broker - Exchange/wallet type
 * @param asset - Asset symbol (BTC, ETH, etc.)
 * @returns number - Price in THB, 0 if not found
 */
export function getAssetPrice(
  prices: MarketData,
  broker: string,
  asset: string
): number {
  const priceKey = getPriceKey(broker);
  const priceSource = prices[priceKey] as Record<string, number>;
  return priceSource?.[asset] ?? 0;
}

/**
 * Calculate P&L percentage
 * @param marketPrice - Current market price
 * @param avgPrice - Average buy price
 * @returns number - P&L percentage (e.g., 15.5 for +15.5%)
 */
export function calculatePnL(marketPrice: number, avgPrice?: number): number {
  if (marketPrice <= 0 || !avgPrice || avgPrice <= 0) return 0;
  return ((marketPrice - avgPrice) / avgPrice) * 100;
}

/**
 * Calculate current value of holding
 * @param amount - Asset amount
 * @param marketPrice - Current market price
 * @returns number - Value in THB
 */
export function calculateValue(amount: number, marketPrice: number): number {
  return amount * marketPrice;
}
