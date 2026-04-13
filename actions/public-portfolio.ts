"use server";

import { db } from "@/lib/db";
import { specialPortfolio, specialPortfolioHoldings, assets, marketPrices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getSpecialPortfolio(portfolio_id: string) {
  const [portfolio] = await db
    .select()
    .from(specialPortfolio)
    .where(eq(specialPortfolio.id, portfolio_id))
    .limit(1);

  if (!portfolio) throw new Error("ไม่พบพอร์ตนี้");

  // ดึง holdings พร้อม asset info
  const holdings = await db
    .select({
      id: specialPortfolioHoldings.id,
      portfolio_id: specialPortfolioHoldings.portfolio_id,
      coin_id: specialPortfolioHoldings.coin_id,
      amount: specialPortfolioHoldings.amount,
      cost_thb: specialPortfolioHoldings.cost_thb,
      buy_price_thb: specialPortfolioHoldings.buy_price_thb,
      bought_at: specialPortfolioHoldings.bought_at,
      note: specialPortfolioHoldings.note,
      asset_symbol: assets.symbol,
      asset_name: assets.name,
      asset_image: assets.image_url,
    })
    .from(specialPortfolioHoldings)
    .leftJoin(assets, eq(specialPortfolioHoldings.coin_id, assets.id))
    .where(eq(specialPortfolioHoldings.portfolio_id, portfolio_id));

  // ดึงราคาปัจจุบันของแต่ละ coin
  const coinIds = [...new Set(holdings.map((h) => h.coin_id))];
  const currentPrices: Record<string, {
    price_usd: string;
    price_thb: string | null;
    change_24h: string | null;
  }> = {};

  for (const coinId of coinIds) {
    const [price] = await db
      .select()
      .from(marketPrices)
      .where(eq(marketPrices.asset_id, coinId))
      .orderBy(desc(marketPrices.last_updated))
      .limit(1);
    if (price) currentPrices[coinId] = price;
  }

  return { portfolio, holdings, currentPrices };
}

export async function getSpecialPriceHistory(asset_id: string, days = 90) {
  const history = await db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.asset_id, asset_id))
    .orderBy(desc(marketPrices.last_updated))
    .limit(days);

  return history.reverse().map((p) => ({
    date: p.last_updated
      ? new Date(p.last_updated).toLocaleDateString("th-TH", { day: "numeric", month: "short" })
      : "-",
    price_usd: Number(p.price_usd),
    price_thb: p.price_thb ? Number(p.price_thb) : null,
    change_24h: p.change_24h ? Number(p.change_24h) : null,
  }));
}

// Admin: อัปเดต holding
export async function updateSpecialHolding(
  holding_id: string,
  data: { amount?: string; cost_thb?: string; buy_price_thb?: string; note?: string }
) {
  await db
    .update(specialPortfolioHoldings)
    .set(data)
    .where(eq(specialPortfolioHoldings.id, holding_id));
}
