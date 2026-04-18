/**
 * Public Portfolio Page — ไม่ต้อง login
 * Route: /p/[id]
 * Special Port: /p/a0000000-0000-0000-0000-000000000001
 */

import { getSpecialPortfolio, getSpecialPriceHistory, getSpecialPortfolioSnapshots } from "@/actions/public-portfolio";
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

    // Force using the canonical snapshots table as the primary source for the chart
    const portfolioSnapshots = await getSpecialPortfolioSnapshots(id);

    return (
      <PublicPortfolioClient
        portfolio={detail.portfolio}
        holdings={detail.holdings}
        currentPrices={detail.currentPrices}
        priceHistories={priceHistories}
        // pass the full canonical snapshots array unmodified
        portfolioSnapshots={portfolioSnapshots}
      />
    );
  } catch (err) {
    // Log the underlying error to help debugging why the page returns 404
    // (keeps behavior the same for users)
    // eslint-disable-next-line no-console
    console.error("[PublicPortfolioPage] error:", err);
    notFound();
  }
}
