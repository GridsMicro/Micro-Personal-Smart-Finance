/**
 * Public Market Page
 * Route: /p/market
 * แสดงราคาเหรียญ real-time สาธารณะ ไม่ต้อง login
 */

import MarketClient from "./market-client";

export const revalidate = 30;

export const metadata = {
  title: "Market — Micro Finance",
  description: "ราคาเหรียญ crypto real-time",
};

export default function MarketPage() {
  return <MarketClient />;
}
