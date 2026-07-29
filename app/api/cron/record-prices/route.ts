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
import { assets, marketPrices, specialPortfolio, specialPortfolioHoldings, specialPortfolioSnapshots, cronLogs } from "@/db/schema";
import { eq, sql, asc, gte, and } from "drizzle-orm";
import { saveSnapshotsToCache } from "@/lib/snapshot-cache";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Track attemptsMade outside try so we can audit/log in the outer catch
  let attemptsMade: number | null = null;

  try {
    // ── 0. Aggressive NEON DB warm-up & verification (Ping / Warm up) ──
    // Try up to 10 times with short delays and require two consecutive successful lightweight queries
    // before proceeding to any external network calls (Bitkub / CoinGecko). This ensures Neon is awake.
    const MAX_WAKE_ATTEMPTS = 10;
    const WAKE_DELAY_MS = 1500; // 1.5 seconds between attempts
    let isAwake = false;
    attemptsMade = 0;
    let lastWakeError: any = null;

    for (let attempt = 1; attempt <= MAX_WAKE_ATTEMPTS; attempt++) {
      attemptsMade = attempt;
      try {
        // First lightweight ping
        await db.select().from(assets).limit(1);
        console.log(`[Neon] Wake-up attempt ${attempt}/${MAX_WAKE_ATTEMPTS} - ping OK (first)`);

        // Small verification delay, then second ping to ensure stability
        await new Promise((resolve) => setTimeout(resolve, 500));
        await db.select().from(assets).limit(1);
        console.log(`[Neon] Wake-up attempt ${attempt}/${MAX_WAKE_ATTEMPTS} - ping OK (verification)`);

        // Two consecutive pings succeeded -> mark healthy and proceed
        isAwake = true;
        break;
      } catch (err) {
        lastWakeError = err;
        console.log(`[Neon] Wake-up attempt ${attempt}/${MAX_WAKE_ATTEMPTS} failed: ${String(err)}`);
        if (attempt < MAX_WAKE_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, WAKE_DELAY_MS));
        }
      }
    }

    // Log warm-up outcome (attempts and success/failure) so we have an audit trail
    try {
      if (isAwake) {
        await db.insert(cronLogs).values({
          job: 'record-prices',
          attempts: attemptsMade,
          success: true,
          message: `Success on attempt ${attemptsMade}`,
          payload: null,
        });
      } else {
        await db.insert(cronLogs).values({
          job: 'record-prices',
          attempts: attemptsMade,
          success: false,
          message: String(lastWakeError) || '[Neon] Database did not wake after max wake attempts',
          payload: null,
        });
      }
    } catch (logErr) {
      console.error('[cron] Failed to write cron_logs entry:', logErr);
    }

    if (!isAwake) {
      return NextResponse.json({ error: "[Neon] Database did not wake after max wake attempts — aborting snapshot process" }, { status: 500 });
    }

    const activeAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.is_active, true));

    const records: { asset: string; price_usd: number; price_thb: number; source: string }[] = [];

    // เวลาปัจจุบัน +7 ชั่วโมง (เวลาไทย ประเทศไทย)
    const nowThai = new Date(Date.now() + 7 * 60 * 60 * 1000);

    // ── 1. ดึงราคาทั้งหมดจาก Bitkub ก่อน (ใช้เป็น exchange rate และใช้เป็นราคา THB ตรงๆ ถ้ามี) ──
    let usdtThbRate = 34.5; // fallback
    let bitkubData: any = {};
    try {
      const bitkubRes = await fetch("https://api.bitkub.com/api/market/ticker");
      if (bitkubRes.ok) {
        bitkubData = await bitkubRes.json();
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
          if (!p || typeof p.usd === 'undefined') {
            console.warn(`[cron] Price not found for ${asset.symbol} (${asset.coingecko_id})`);
            continue;
          }

          let priceThb = p.usd * usdtThbRate;

          // แบบเดียวกับ public-portfolio: ถ้ามีราคา THB จาก Bitkub ตรงๆ (เช่น TRX, BTC) ให้ใช้ค่านั้นเป็นหลัก
          const expectedSymbol = asset.symbol?.toUpperCase();
          const bkPrice = expectedSymbol ? bitkubData[`THB_${expectedSymbol}`]?.last : undefined;
          
          if (bkPrice) {
            priceThb = Number(bkPrice);
          }

          await db.insert(marketPrices).values({
            asset_id: asset.id,
            price_usd: p.usd.toString(),
            price_thb: priceThb.toFixed(4),
            change_24h: p.usd_24h_change?.toFixed(4) ?? null,
            volume_24h: p.usd_24h_vol?.toFixed(2) ?? null,
            market_cap: p.usd_market_cap?.toFixed(2) ?? null,
            last_updated: nowThai,
          });

          records.push({ asset: asset.symbol, price_usd: p.usd, price_thb: priceThb, source: "coingecko" });
        }
      }
    }

    // ── 3. บันทึกราคาจาก Bitkub (กรณีข้อมูลเป็น source bitkub โดยเฉพาะ) ──
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
      } else {
        const expectedSymbol = asset.symbol?.toUpperCase();
        const bkPrice = expectedSymbol ? bitkubData[`THB_${expectedSymbol}`]?.last : undefined;
        if (bkPrice) {
          priceThb = Number(bkPrice);
          priceUsd = priceThb / usdtThbRate;
        }
      }

      await db.insert(marketPrices).values({
        asset_id: asset.id,
        price_usd: priceUsd.toFixed(8),
        price_thb: priceThb.toFixed(4),
        change_24h: null,
        last_updated: nowThai,
      });

      records.push({ asset: asset.symbol, price_usd: priceUsd, price_thb: priceThb, source: "bitkub" });
    }

    console.log(`[cron] Recorded ${records.length} prices | USDT/THB rate: ${usdtThbRate}`);

    // ── 4. Special Portfolio snapshot (Bitkub TradingView historical closes) ──
    try {
      const SP_ID = 'a0000000-0000-0000-0000-000000000001';
      const [sp] = await db.select().from(specialPortfolio).where(eq(specialPortfolio.id, SP_ID)).limit(1);
      if (sp) {
        const holdings = await db.select().from(specialPortfolioHoldings).where(eq(specialPortfolioHoldings.portfolio_id, SP_ID));
        if (holdings && holdings.length) {
          const pairsNeeded: string[] = [];
          const symbolMap: Record<string, { holdingId: string; amount: number; coinId: string }> = {};
          for (const h of holdings) {
            const assetRow = await db.select().from(assets).where(eq(assets.id, h.coin_id)).limit(1);
            const symbol = assetRow[0]?.symbol?.toUpperCase();
            if (!symbol) continue;
            const pair = `${symbol}_THB`;
            if (!pairsNeeded.includes(pair)) pairsNeeded.push(pair);
            symbolMap[symbol] = { holdingId: h.id, amount: Number(h.amount), coinId: h.coin_id };
          }

          const priceByPairDate: Record<string, Record<string, number>> = {};
          const nowSec = Math.floor(Date.now() / 1000);
          const fromSec = 1774972800;
          for (const pair of pairsNeeded) {
            const url = `https://api.bitkub.com/tradingview/history?symbol=${pair}&resolution=1D&from=${fromSec}&to=${nowSec}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`TradingView history fetch failed for ${pair} status=${res.status}`);
            const json = await res.json();
            const ts: number[] = Array.isArray(json.t) ? json.t : [];
            const closes: number[] = Array.isArray(json.c) ? json.c : [];
            priceByPairDate[pair] = {};
            const len = Math.min(ts.length, closes.length);
            for (let i = 0; i < len; i++) {
              const date = new Date(ts[i] * 1000).toISOString().slice(0,10);
              priceByPairDate[pair][date] = Number(closes[i]);
            }
          }

          const nowThai = new Date(Date.now() + 7 * 60 * 60 * 1000);
          const dateKey = nowThai.toISOString().slice(0,10);
          const snapshotHoldings: any[] = [];
          let totalValueThb = 0;
          for (const [sym, meta] of Object.entries(symbolMap)) {
            const pair = `${sym}_THB`;
            const price = priceByPairDate[pair]?.[dateKey];
            if (typeof price === 'undefined') {
              console.warn(`[cron] Missing TradingView close for ${pair} on ${dateKey}`);
              continue;
            }
            const amount = meta.amount;
            const value = amount * price;
            totalValueThb += value;
            snapshotHoldings.push({ holding_id: meta.holdingId, coin_id: meta.coinId, amount, price_thb: price, value_thb: value });
          }

          // Upsert the daily special snapshot using Drizzle
          await db.delete(specialPortfolioSnapshots).where(sql`portfolio_id = ${SP_ID} AND recorded_at::date = ${dateKey}::date`);
          
          const btcPrice = snapshotHoldings.find(h => h.coin_id === 'bitcoin')?.price_thb;
          const trxPrice = snapshotHoldings.find(h => h.coin_id === 'tron')?.price_thb;

          await db.insert(specialPortfolioSnapshots).values({
            portfolio_id: SP_ID,
            snapshot_data: JSON.stringify({ date: dateKey, holdings: snapshotHoldings }),
            total_value_thb: totalValueThb.toFixed(6),
            total_thb: totalValueThb.toFixed(6),
            btc_price_thb: btcPrice ? btcPrice.toString() : null,
            trx_price_thb: trxPrice ? trxPrice.toString() : null,
            recorded_at: nowThai,
          });
          console.log(`[cron] Upserted special_portfolio_snapshots for ${dateKey} total THB=${totalValueThb.toFixed(6)}`);

          // ── Update File Cache after DB Insert ──
          try {
            const since = new Date("2026-04-01T00:00:00.000Z");
            const allRows = await db
              .select()
              .from(specialPortfolioSnapshots)
              .where(and(eq(specialPortfolioSnapshots.portfolio_id, SP_ID), gte(specialPortfolioSnapshots.recorded_at, since)))
              .orderBy(asc(specialPortfolioSnapshots.recorded_at));

            const cacheData = [];
            const seen = new Set<string>();
            for (const r of allRows) {
              if (!r.recorded_at) continue;
              const snapshot_date = new Date(r.recorded_at).toISOString().slice(0, 10);
              if (!seen.has(snapshot_date)) {
                seen.add(snapshot_date);
                let total = Number(r.total_thb ?? r.total_value_thb ?? 0);
                if (total === 0 && r.snapshot_data) {
                  try {
                    const sd = typeof r.snapshot_data === 'string' ? JSON.parse(r.snapshot_data) : r.snapshot_data;
                    if (sd && Array.isArray(sd.holdings)) {
                      total = sd.holdings.reduce((sum: number, h: any) => sum + Number(h.value_thb || 0), 0);
                    }
                  } catch {}
                }
                cacheData.push({
                  snapshot_date,
                  total_value_thb: total,
                  btc_price_thb: r.btc_price_thb ? Number(r.btc_price_thb) : null,
                  trx_price_thb: r.trx_price_thb ? Number(r.trx_price_thb) : null,
                });
              }
            }
            if (cacheData.length > 0) {
              await saveSnapshotsToCache(cacheData);
            }
          } catch (cacheErr) {
            console.error("[cron] Failed to update file cache:", cacheErr);
          }
        }
      }
    } catch (err) {
      console.warn('[cron] Special portfolio snapshot failed:', err);
      try {
        await db.insert(cronLogs).values({
          job: 'record-prices',
          attempts: attemptsMade || 0,
          success: false,
          message: `special_portfolio snapshot failed: ${String(err)}`,
          payload: null,
        });
      } catch (logErr) {
        console.error('[cron] Failed to write cron_logs entry after snapshot failure:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      recorded: records.length,
      usdt_thb_rate: usdtThbRate,
      timestamp: nowThai.toISOString(),
      prices: records,
    });
  } catch (err) {
    console.error("[cron] Error:", err);
    try {
      await db.insert(cronLogs).values({
        job: 'record-prices',
        attempts: typeof attemptsMade === 'number' ? attemptsMade : 0,
        success: false,
        message: String(err),
        payload: null,
      });
    } catch (logErr) {
      console.error('[cron] Failed to write cron_logs entry in global catch:', logErr);
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
