"use server";

import { db } from "@/lib/db";
import { specialPortfolio, specialPortfolioHoldings, assets, marketPrices, specialPortfolioSnapshots } from "@/db/schema";
import { eq, desc, gte, asc, and } from "drizzle-orm";
import { requireAdmin } from "@/app/proxy/auth";

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

  // ── ดึงราคาแบบ Real-time จาก API ──
  const assetDetails = await db
    .select({ id: assets.id, coingecko_id: assets.coingecko_id, symbol: assets.symbol })
    .from(assets)
    .where(eq(assets.is_active, true));

  const coinDetailsMap = new Map(assetDetails.map(a => [a.id?.toString().trim(), a]));
  const currentPrices: Record<string, {
    price_usd: string;
    price_thb: string | null;
    change_24h: string | null;
  }> = {};

  try {
    // 1. ดึงราคา USD จาก CoinGecko (Cache 30 วิ)
    const cgIds = assetDetails.filter(a => a.coingecko_id).map(a => a.coingecko_id).join(",");
    const cgRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    );
    const cgData = cgRes.ok ? await cgRes.json() : {};
 
    // 2. ดึงราคา THB จาก Bitkub (Cache 30 วิ)
    const bitkubRes = await fetch("https://api.bitkub.com/api/market/ticker", { next: { revalidate: 30 } });
    const bitkubData = bitkubRes.ok ? await bitkubRes.json() : {};

    // 3. รวมราคา
    for (const asset of assetDetails) {
      const cg = cgData[asset.coingecko_id ?? ""];
      const expectedSymbol = asset.symbol?.toUpperCase();
      const bk = expectedSymbol ? bitkubData[`THB_${expectedSymbol}`] : undefined;

      const priceUsd = cg?.usd?.toString();
      let priceThb = bk?.last?.toString();

      // ถ้าไม่มีราคาจาก Bitkub ตรงๆ ให้คำนวณจาก USD * USDT_THB rate (ถ้ามี)
      if (!priceThb && priceUsd && bitkubData["THB_USDT"]) {
        const usdtThb = Number(bitkubData["THB_USDT"].last);
        priceThb = (Number(priceUsd) * usdtThb).toFixed(4);
      }

      const key = asset.id?.toString().trim();
      if (priceUsd || priceThb) {
        currentPrices[key] = {
          price_usd: priceUsd ?? "0",
          price_thb: priceThb ?? null,
          change_24h: cg?.usd_24h_change?.toFixed(4) ?? null,
        };
      }
    }
  } catch (err) {
    console.error("[getSpecialPortfolio] Live price fetch failed:", err);
  }

  // Fallback: ถ้า API ล่ม หรือตัวไหนไม่มีราคา ให้ดึงจาก DB
  for (const rawCoinId of [...new Set(holdings.map((h) => h.coin_id))]) {
    const coinId = rawCoinId?.toString().trim();
    if (!currentPrices[coinId]) {
      // Try DB fallback
      const [dbPrice] = await db
        .select()
        .from(marketPrices)
        .where(eq(marketPrices.asset_id, coinId))
        .orderBy(desc(marketPrices.last_updated))
        .limit(1);
      if (dbPrice) {
        // Log for debugging missing live price — helpful to see if TRX falls back correctly
        // eslint-disable-next-line no-console
        console.log(`[getSpecialPortfolio] Fallback DB price for ${coinId}:`, { price_thb: dbPrice.price_thb, last_updated: dbPrice.last_updated });
        currentPrices[coinId] = {
          price_usd: dbPrice.price_usd,
          price_thb: dbPrice.price_thb,
          change_24h: dbPrice.change_24h,
        };
      } else {
        // eslint-disable-next-line no-console
        console.log(`[getSpecialPortfolio] No price available for ${coinId} (live or DB)`);
      }
    }
  }

  // Debug: show which assets we have prices for (helps verify TRX presence)
  // eslint-disable-next-line no-console
  console.log("[getSpecialPortfolio] currentPrices keys:", Object.keys(currentPrices));
  // eslint-disable-next-line no-console
  console.log("[getSpecialPortfolio] tron price: ", JSON.stringify(currentPrices["tron"] ?? null));

  return { portfolio, holdings, currentPrices };
}

export async function getSpecialPriceHistory(asset_id: string, days = 90) {
  // Use only `special_portfolio_snapshots` as the source of truth for historical prices.
  // For BTC/TRX, prefer the dedicated columns `btc_price_thb` / `trx_price_thb`.
  // For other assets, extract per-holding `price_thb` from `snapshot_data->'holdings'`.

  const [assetRow] = await db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.id, asset_id)).limit(1);

  const daysBack = days;
  const start = new Date();
  start.setDate(start.getDate() - (daysBack - 1));
  const since = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0));

  const rows = await db
    .select({ recorded_at: specialPortfolioSnapshots.recorded_at, btc: specialPortfolioSnapshots.btc_price_thb, trx: specialPortfolioSnapshots.trx_price_thb, snapshot_data: specialPortfolioSnapshots.snapshot_data })
    .from(specialPortfolioSnapshots)
    .where(gte(specialPortfolioSnapshots.recorded_at, since))
    .orderBy(asc(specialPortfolioSnapshots.recorded_at));

  // Build date -> price map using snapshot columns or snapshot_data holdings
  const priceMap = new Map<string, number | null>();
  const isBtc = assetRow?.symbol?.toUpperCase() === "BTC";
  const isTrx = assetRow?.symbol?.toUpperCase() === "TRX";

  for (const r of rows) {
    if (!r.recorded_at) continue;
    const d = new Date(r.recorded_at).toISOString().slice(0, 10);
    let p: number | null = null;
    if (isBtc) {
      p = r.btc !== null && typeof r.btc !== 'undefined' ? Number(r.btc) : null;
    } else if (isTrx) {
      p = r.trx !== null && typeof r.trx !== 'undefined' ? Number(r.trx) : null;
    } else {
      try {
        const sd = typeof r.snapshot_data === 'string' ? JSON.parse(r.snapshot_data) : r.snapshot_data;
        if (sd && Array.isArray(sd.holdings)) {
          const found = sd.holdings.find((h: any) => String(h.coin_id) === String(asset_id));
          if (found && (found.price_thb !== undefined && found.price_thb !== null)) {
            p = Number(found.price_thb);
          }
        }
      } catch (e) {
        p = null;
      }
    }
    priceMap.set(d, p === null ? null : Number(p));
  }

  // Produce continuous sequence of days (since -> since + daysBack -1), forward-fill last known
  const out: any[] = [];
  let lastKnown: number | null = null;
  for (let i = 0; i < daysBack; i++) {
    const dt = new Date(since);
    dt.setUTCDate(since.getUTCDate() + i);
    const key = dt.toISOString().slice(0, 10);
    const p = priceMap.has(key) ? priceMap.get(key) ?? null : null;
    if (p !== null) lastKnown = p;
    out.push({ date: key, price_usd: 0, price_thb: p !== null ? p : lastKnown, change_24h: null });
  }

  return out;
}

export async function getSpecialPortfolioSnapshots(portfolio_id: string) {
  // Always fetch from 2026-04-01 to today for the special portfolio view
  const since = new Date("2026-04-01T00:00:00.000Z");
  const rows = await db
    .select()
    .from(specialPortfolioSnapshots)
    .where(and(eq(specialPortfolioSnapshots.portfolio_id, portfolio_id), gte(specialPortfolioSnapshots.recorded_at, since)))
    .orderBy(asc(specialPortfolioSnapshots.recorded_at));

  // Map to date-ascending daily points using canonical fields.
  // Prefer `total_thb` (canonical total) but fall back to `total_value_thb` for compatibility.
  const out: { snapshot_date: string; total_value_thb: number; btc_price_thb?: number | null; trx_price_thb?: number | null }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!r.recorded_at) continue;
    const snapshot_date = new Date(r.recorded_at).toISOString().slice(0, 10);
    if (!seen.has(snapshot_date)) {
      seen.add(snapshot_date);
      out.push({
        snapshot_date,
        total_value_thb: Number(r.total_thb ?? r.total_value_thb ?? 0),
        btc_price_thb: r.btc_price_thb ? Number(r.btc_price_thb) : null,
        trx_price_thb: r.trx_price_thb ? Number(r.trx_price_thb) : null,
      });
    }
  }

  return out;
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

export async function addSpecialHolding(data: {
  portfolio_id: string;
  coin_id: string;
  amount: string;
  cost_thb: string;
  buy_price_thb: string;
  bought_at: string;
  note?: string;
}) {
  await requireAdmin();
  const [holding] = await db
    .insert(specialPortfolioHoldings)
    .values({
      portfolio_id: data.portfolio_id,
      coin_id: data.coin_id,
      amount: data.amount,
      cost_thb: data.cost_thb,
      buy_price_thb: data.buy_price_thb,
      bought_at: new Date(data.bought_at),
      note: data.note ?? null,
    })
    .returning();
  return holding;
}

export async function deleteSpecialHolding(holding_id: string) {
  await requireAdmin();
  await db.delete(specialPortfolioHoldings).where(eq(specialPortfolioHoldings.id, holding_id));
}
