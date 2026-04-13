import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getPortfolioDetail, getPriceHistory } from "@/actions/portfolio-detail";
import PortfolioDetailClient from "./portfolio-detail-client";

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await redirectIfNotAuth();
  const { id } = await params;
  const detail = await getPortfolioDetail(id);

  // ดึงประวัติราคาของทุก coin ใน portfolio
  const coinIds = [...new Set(detail.holdings.map((h) => h.coin_id))];
  const priceHistories: Record<string, Awaited<ReturnType<typeof getPriceHistory>>> = {};
  for (const coinId of coinIds) {
    priceHistories[coinId] = await getPriceHistory(coinId, 90);
  }

  return (
    <PortfolioDetailClient
      portfolio={detail.portfolio}
      holdings={detail.holdings}
      transactions={detail.transactions}
      currentPrices={detail.currentPrices}
      priceHistories={priceHistories}
    />
  );
}
