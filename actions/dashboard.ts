"use server";

import { db } from "@/lib/db";
import { mcPortfolios, mcPortfolioAssets, mcPortfolioTransactions } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { eq, desc, inArray } from "drizzle-orm";

export async function getDashboardData() {
  const session = await requireAuth();
  const user_id = session.user.id;

  // ดึง portfolios ทั้งหมดของ user
  const portfolios = await db
    .select()
    .from(mcPortfolios)
    .where(eq(mcPortfolios.user_id, user_id))
    .orderBy(desc(mcPortfolios.created_at));

  const portfolioIds = portfolios.map((p) => p.id);

  // นับ assets รวมทุกพอร์ต
  const allAssets = portfolioIds.length > 0
    ? await db
        .select()
        .from(mcPortfolioAssets)
        .where(inArray(mcPortfolioAssets.portfolio_id, portfolioIds))
    : [];

  // ดึง transactions ล่าสุด 5 รายการ รวมทุกพอร์ต
  const recentTransactions = portfolioIds.length > 0
    ? await db
        .select()
        .from(mcPortfolioTransactions)
        .where(inArray(mcPortfolioTransactions.portfolio_id, portfolioIds))
        .orderBy(desc(mcPortfolioTransactions.created_at))
        .limit(5)
    : [];

  return {
    portfolioCount: portfolios.length,
    portfolios,
    assetCount: allAssets.length,
    recentTransactions,
  };
}
