import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { db } from "../../../../db";
import { dailySnapshots } from "../../../../db/schema";
import { eq, desc, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/trends
 * ดึงข้อมูลแนวโน้มมูลค่าพอร์ตรวม (dailySnapshots)
 * 
 * Query params:
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 3. Build query
    let query = db
      .select({
        id: dailySnapshots.id,
        date: dailySnapshots.date,
        totalValue: dailySnapshots.totalValue,
        holdingsJson: dailySnapshots.holdingsJson,
        fiatCode: dailySnapshots.fiatCode,
      })
      .from(dailySnapshots)
      .where(eq(dailySnapshots.userId, userId))
      .orderBy(desc(dailySnapshots.date));

    // Apply date filters
    if (startDate && endDate) {
      query = db
        .select({
          id: dailySnapshots.id,
          date: dailySnapshots.date,
          totalValue: dailySnapshots.totalValue,
          holdingsJson: dailySnapshots.holdingsJson,
          fiatCode: dailySnapshots.fiatCode,
        })
        .from(dailySnapshots)
        .where(eq(dailySnapshots.userId, userId))
        .where(gte(dailySnapshots.date, startDate))
        .where(lte(dailySnapshots.date, endDate))
        .orderBy(desc(dailySnapshots.date));
    }

    // 4. Fetch data
    const data = await query;

    // 5. Transform data for charts
    const trends = data.map((row: typeof data[0]) => ({
      date: row.date,
      totalValue: parseFloat(row.totalValue.toString()),
      holdings: row.holdingsJson as Record<string, number>,
      fiatCode: row.fiatCode,
    })).reverse(); // Oldest first for chart

    // 6. Calculate stats
    const stats = {
      startValue: trends.length > 0 ? trends[0].totalValue : 0,
      endValue: trends.length > 0 ? trends[trends.length - 1].totalValue : 0,
      maxValue: Math.max(...trends.map(t => t.totalValue), 0),
      minValue: Math.min(...trends.map(t => t.totalValue), 0),
      change: trends.length > 1 
        ? trends[trends.length - 1].totalValue - trends[0].totalValue 
        : 0,
      changePercent: trends.length > 1 && trends[0].totalValue > 0
        ? ((trends[trends.length - 1].totalValue - trends[0].totalValue) / trends[0].totalValue) * 100
        : 0,
    };

    return NextResponse.json({
      trends,
      stats,
      period: {
        start: trends.length > 0 ? trends[0].date : null,
        end: trends.length > 0 ? trends[trends.length - 1].date : null,
        days: trends.length,
      }
    });

  } catch (error: unknown) {
    console.error("Analytics trends error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch trends";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
