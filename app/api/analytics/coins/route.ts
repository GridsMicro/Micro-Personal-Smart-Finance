import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { db } from "../../../../db";
import { portfolioCoinSnapshots, portfolios } from "../../../../db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/coins
 * ดึงข้อมูล performance รายเหรียญ (portfolioCoinSnapshots)
 * 
 * Query params:
 * - portfolioId: ดึงเฉพาะพอร์ตนี้ (optional)
 * - asset: ดึงเฉพาะเหรียญนี้ (optional)
 * - days: จำนวนวันย้อนหลัง (default: 30)
 * - startDate: วันเริ่มต้น (YYYY-MM-DD)
 * - endDate: วันสิ้นสุด (YYYY-MM-DD)
 */
export async function GET(req: Request) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse query params
    const { searchParams } = new URL(req.url);
    const portfolioId = searchParams.get("portfolioId");
    const asset = searchParams.get("asset");
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 3. Get user's portfolios
    const userPortfolios = await db
      .select({ id: portfolios.id, name: portfolios.name, exchangeType: portfolios.exchangeType })
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    const portfolioIds = userPortfolios.map((p: { id: number }) => p.id);
    
    if (portfolioIds.length === 0) {
      return NextResponse.json({ 
        coins: [],
        stats: {},
        portfolios: []
      });
    }

    // 4. Build base conditions
    const conditions = [eq(portfolioCoinSnapshots.userId, userId)];
    
    if (portfolioId) {
      conditions.push(eq(portfolioCoinSnapshots.portfolioId, parseInt(portfolioId)));
    }
    
    if (asset) {
      conditions.push(eq(portfolioCoinSnapshots.asset, asset));
    }
    
    if (startDate && endDate) {
      conditions.push(gte(portfolioCoinSnapshots.date, startDate));
      conditions.push(lte(portfolioCoinSnapshots.date, endDate));
    }

    // 5. Fetch data
    const data = await db
      .select({
        id: portfolioCoinSnapshots.id,
        portfolioId: portfolioCoinSnapshots.portfolioId,
        asset: portfolioCoinSnapshots.asset,
        amount: portfolioCoinSnapshots.amount,
        priceThb: portfolioCoinSnapshots.priceThb,
        valueThb: portfolioCoinSnapshots.valueThb,
        date: portfolioCoinSnapshots.date,
      })
      .from(portfolioCoinSnapshots)
      .where(and(...conditions))
      .orderBy(desc(portfolioCoinSnapshots.date));

    // 6. Transform data
    const coins = data.map((row: typeof data[0]) => ({
      id: row.id,
      portfolioId: row.portfolioId,
      asset: row.asset,
      amount: parseFloat(row.amount.toString()),
      priceThb: parseFloat(row.priceThb.toString()),
      valueThb: parseFloat(row.valueThb.toString()),
      date: row.date,
    }));

    // 7. Group by asset for summary
    const assetStats: Record<string, {
      asset: string;
      totalValue: number;
      avgPrice: number;
      latestAmount: number;
      latestDate: string;
      portfolioCount: number;
    }> = {};

    coins.forEach((coin: typeof coins[0]) => {
      if (!assetStats[coin.asset]) {
        assetStats[coin.asset] = {
          asset: coin.asset,
          totalValue: 0,
          avgPrice: 0,
          latestAmount: coin.amount,
          latestDate: coin.date,
          portfolioCount: new Set().size,
        };
      }
      
      // Keep latest value
      if (coin.date >= assetStats[coin.asset].latestDate) {
        assetStats[coin.asset].latestAmount = coin.amount;
        assetStats[coin.asset].latestDate = coin.date;
        assetStats[coin.asset].totalValue = coin.valueThb;
      }
      
      // Simple average (can be improved)
      assetStats[coin.asset].avgPrice = 
        (assetStats[coin.asset].avgPrice + coin.priceThb) / 2;
    });

    // 8. Group by portfolio
    const portfolioStats: Record<number, {
      portfolioId: number;
      totalValue: number;
      assetCount: number;
      assets: string[];
    }> = {};

    coins.forEach((coin: typeof coins[0]) => {
      if (!portfolioStats[coin.portfolioId]) {
        portfolioStats[coin.portfolioId] = {
          portfolioId: coin.portfolioId,
          totalValue: 0,
          assetCount: 0,
          assets: [],
        };
      }
      
      if (!portfolioStats[coin.portfolioId].assets.includes(coin.asset)) {
        portfolioStats[coin.portfolioId].assets.push(coin.asset);
        portfolioStats[coin.portfolioId].assetCount += 1;
      }
      
      // Sum latest values per portfolio (simplified)
      portfolioStats[coin.portfolioId].totalValue += coin.valueThb;
    });

    return NextResponse.json({
      coins,
      stats: {
        byAsset: Object.values(assetStats),
        byPortfolio: Object.values(portfolioStats),
      },
      portfolios: userPortfolios,
      filters: {
        portfolioId: portfolioId || null,
        asset: asset || null,
        days,
        startDate: startDate || null,
        endDate: endDate || null,
      }
    });

  } catch (error: any) {
    console.error("Analytics coins error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coin data" },
      { status: 500 }
    );
  }
}
