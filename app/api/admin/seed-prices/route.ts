/**
 * Admin: Seed historical prices from CoinGecko
 * GET /api/admin/seed-prices?asset=bitcoin&days=30
 * ดึงราคาย้อนหลังจาก CoinGecko แล้วบันทึกลง market_prices
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketPrices, assets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assetId = req.nextUrl.searchParams.get("asset") ?? "bitcoin";
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "14");

  try {
    // ดึงข้อมูล asset
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    if (!asset) return NextResponse.json({ error: `Asset ${assetId} not found` }, { status: 404 });

    // CoinGecko market_chart — ราคาย้อนหลัง N วัน (daily)
    const cgRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/${assetId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      { headers: { Accept: "application/json" } }
    );

    if (!cgRes.ok) throw new Error(`CoinGecko error: ${cgRes.status}`);

    const cgData: { prices: [number, number][]; total_volumes: [number, number][]; market_caps: [number, number][] } = await cgRes.json();

    // ดึง THB rate
    const thbRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${assetId}&vs_currencies=thb`,
      { headers: { Accept: "application/json" } }
    );
    const thbData: Record<string, { thb: number }> = await thbRes.json();
    const thbRate = thbData[assetId]?.thb ?? 0;

    // ลบข้อมูลเก่าของ asset นี้ก่อน
    await db.delete(marketPrices).where(eq(marketPrices.asset_id, assetId));

    // Deduplicate — เอาแค่วันละ 1 จุด (จุดแรกของแต่ละวัน)
    const dailyMap = new Map<string, [number, number]>();
    for (const [timestamp, price] of cgData.prices) {
      const dateKey = new Date(timestamp).toISOString().slice(0, 10);
      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, [timestamp, price]);
    }
    const dailyPrices = Array.from(dailyMap.entries()).map(([, v]) => v);

    // INSERT ราคาจริงทีละวัน
    const records = [];
    for (let i = 0; i < dailyPrices.length; i++) {
      const [timestamp, priceUsd] = dailyPrices[i];
      const volume = cgData.total_volumes.find(([t]) => new Date(t).toISOString().slice(0, 10) === new Date(timestamp).toISOString().slice(0, 10))?.[1] ?? 0;
      const marketCap = cgData.market_caps.find(([t]) => new Date(t).toISOString().slice(0, 10) === new Date(timestamp).toISOString().slice(0, 10))?.[1] ?? 0;
      const date = new Date(timestamp);

      // คำนวณ THB โดยใช้ ratio จากราคาปัจจุบัน
      const currentUsd = cgData.prices[cgData.prices.length - 1][1];
      const priceThb = currentUsd > 0 ? (priceUsd / currentUsd) * thbRate : 0;

      // คำนวณ change_24h
      const prevPrice = i > 0 ? dailyPrices[i - 1][1] : priceUsd;
      const change24h = prevPrice > 0 ? ((priceUsd - prevPrice) / prevPrice) * 100 : 0;

      const [record] = await db
        .insert(marketPrices)
        .values({
          asset_id: assetId,
          price_usd: priceUsd.toFixed(8),
          price_thb: priceThb.toFixed(2),
          change_24h: change24h.toFixed(4),
          volume_24h: volume.toFixed(2),
          market_cap: marketCap.toFixed(2),
          last_updated: date,
        })
        .returning();

      records.push({ date: date.toISOString().slice(0, 10), price_usd: priceUsd.toFixed(2) });
    }

    return NextResponse.json({
      success: true,
      asset: assetId,
      inserted: records.length,
      records,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
