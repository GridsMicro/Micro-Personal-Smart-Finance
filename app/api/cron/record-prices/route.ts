/**
 * Cron Job: บันทึกราคาสินทรัพย์ทุกวัน 06:00 ICT (23:00 UTC)
 * vercel.json: { "crons": [{ "path": "/api/cron/record-prices", "schedule": "0 23 * * *" }] }
 *
 * แหล่งข้อมูล:
 * - CoinGecko: เหรียญส่วนใหญ่ (price_source = 'coingecko')
 * - Bitkub: USDT/THB rate + THB (price_source = 'bitkub')
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets, marketPrices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.is_active, true));

    const records: { asset: string; price_usd: number; price_thb: number; source: string }[] = [];

    // ── 1. ดึง USDT/THB จาก Bitkub ก่อน (ใช้เป็น exchange rate) ──
    let usdtThbRate = 34.5; // fallback
    try {
      const bitkubRes = await fetch("https://api.bitkub.com/api/market/ticker?sym=THB_USDT");
      if (bitkubRes.ok) {
        const bitkubData = await bitkubRes.json();
        usdtThbRate = bitkubData?.THB_USDT?.last ?? usdtThbRate;
      }
    } catch { /* ใช้ fallback */ }

    // ── 2. ดึงราคาจาก CoinGecko (batch) ──
    const cgAssets = activeAssets.filter((a) => a.price_source === "coingecko" && a.coingecko_id);
    if (cgAssets.length > 0) {
      const ids = cgAssets.map((a) => a.coingecko_id).join(",");
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        { headers: { Accept: "application/json" } }
      );

      if (cgRes.ok) {
        const prices: Record<string, { usd: number; usd_24h_change: number; usd_24h_vol: number; usd_market_cap: number }> = await cgRes.json();

        for (const asset of cgAssets) {
          const p = prices[asset.coingecko_id!];
          if (!p) continue;

          const priceThb = p.usd * usdtThbRate;

          await db.insert(marketPrices).values({
            asset_id: asset.id,
            price_usd: p.usd.toString(),
            price_thb: priceThb.toFixed(4),
            change_24h: p.usd_24h_change?.toFixed(4) ?? null,
            volume_24h: p.usd_24h_vol?.toFixed(2) ?? null,
            market_cap: p.usd_market_cap?.toFixed(2) ?? null,
            last_updated: new Date(),
          });

          records.push({ asset: asset.symbol, price_usd: p.usd, price_thb: priceThb, source: "coingecko" });
        }
      }
    }

    // ── 3. บันทึก USDT/THB rate จาก Bitkub ──
    const bitkubAssets = activeAssets.filter((a) => a.price_source === "bitkub");
    for (const asset of bitkubAssets) {
      let priceUsd = 0;
      let priceThb = 0;

      if (asset.symbol === "USDT") {
        priceUsd = 1;
        priceThb = usdtThbRate;
      } else if (asset.symbol === "THB") {
        priceUsd = 1 / usdtThbRate;
        priceThb = 1;
      }

      await db.insert(marketPrices).values({
        asset_id: asset.id,
        price_usd: priceUsd.toFixed(8),
        price_thb: priceThb.toFixed(4),
        change_24h: null,
        last_updated: new Date(),
      });

      records.push({ asset: asset.symbol, price_usd: priceUsd, price_thb: priceThb, source: "bitkub" });
    }

    console.log(`[cron] Recorded ${records.length} prices | USDT/THB rate: ${usdtThbRate}`);

    return NextResponse.json({
      success: true,
      recorded: records.length,
      usdt_thb_rate: usdtThbRate,
      timestamp: new Date().toISOString(),
      prices: records,
    });
  } catch (err) {
    console.error("[cron] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
