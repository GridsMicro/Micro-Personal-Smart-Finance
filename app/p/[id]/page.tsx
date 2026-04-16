/**
 * Public Portfolio Page — ไม่ต้อง login
 * Route: /p/[id]
 * Special Port: /p/a0000000-0000-0000-0000-000000000001
 */

import { getSpecialPortfolio, getSpecialPriceHistory } from "@/actions/public-portfolio";
import { notFound } from "next/navigation";
import PublicPortfolioClient from "./public-portfolio-client";

export const revalidate = 60; // revalidate every 60 seconds

export default async function PublicPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = await getSpecialPortfolio(id);
    const coinIds = [...new Set(detail.holdings.map((h) => h.coin_id))];

    const priceHistories: Record<string, Awaited<ReturnType<typeof getSpecialPriceHistory>>> = {};
    for (const coinId of coinIds) {
      priceHistories[coinId] = await getSpecialPriceHistory(coinId, 90);
    }

    return (
      <PublicPortfolioClient
        portfolio={detail.portfolio}
        holdings={detail.holdings}
        currentPrices={detail.currentPrices}
        priceHistories={priceHistories}
      />
    );
  } catch {
    notFound();
  }
}
