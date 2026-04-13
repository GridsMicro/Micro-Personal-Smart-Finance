"use server";

import { db } from "@/lib/db";
import { mcPortfolios, mcPortfolioAssets, mcPortfolioTransactions, marketPrices, assets } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { eq, and, desc, asc } from "drizzle-orm";

export async function getPortfolioDetail(portfolio_id: string) {
  const session = await requireAuth();

  const [portfolio] = await db
    .select()
    .from(mcPortfolios)
    .where(and(eq(mcPortfolios.id, portfolio_id), eq(mcPortfolios.user_id, session.user.id)))
    .limit(1);

  if (!portfolio) throw new Error("ไม่พบพอร์ตนี้");

  // ดึง holdings
  const holdings = await db
    .select()
    .from(mcPortfolioAssets)
    .where(eq(mcPortfolioAssets.portfolio_id, portfolio_id));

  // ดึง transactions
  const transactions = await db
    .select()
    .from(mcPortfolioTransactions)
    .where(eq(mcPortfolioTransactions.portfolio_id, portfolio_id))
    .orderBy(desc(mcPortfolioTransactions.created_at));

  // ดึงราคาปัจจุบันของแต่ละ coin
  const coinIds = [...new Set(holdings.map((h) => h.coin_id))];
  const currentPrices: Record<string, { price_usd: string; price_thb: string | null; change_24h: string | null }> = {};

  for (const coinId of coinIds) {
    const [price] = await db
      .select()
      .from(marketPrices)
      .where(eq(marketPrices.asset_id, coinId))
      .orderBy(desc(marketPrices.last_updated))
      .limit(1);
    if (price) currentPrices[coinId] = price;
  }

  return { portfolio, holdings, transactions, currentPrices };
}

export async function getPriceHistory(asset_id: string, days = 30) {
  await requireAuth();

  const history = await db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.asset_id, asset_id))
    .orderBy(asc(marketPrices.last_updated))
    .limit(days);

  return history.map((p) => ({
    date: p.last_updated ? new Date(p.last_updated).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "-",
    price_usd: Number(p.price_usd),
    price_thb: p.price_thb ? Number(p.price_thb) : null,
    change_24h: p.change_24h ? Number(p.change_24h) : null,
  }));
}
