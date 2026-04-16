"use server";

import { db } from "@/lib/db";
import { specialPortfolio, specialPortfolioHoldings, assets, marketPrices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

  const coinDetailsMap = new Map(assetDetails.map(a => [a.id, a]));
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
      const bk = bitkubData[`THB_${asset.symbol}`];

      const priceUsd = cg?.usd?.toString();
      let priceThb = bk?.last?.toString();

      // ถ้าไม่มีราคาจาก Bitkub ตรงๆ ให้คำนวณจาก USD * USDT_THB rate (ถ้ามี)
      if (!priceThb && priceUsd && bitkubData["THB_USDT"]) {
        const usdtThb = Number(bitkubData["THB_USDT"].last);
        priceThb = (Number(priceUsd) * usdtThb).toFixed(4);
      }

      if (priceUsd || priceThb) {
        currentPrices[asset.id] = {
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
  for (const coinId of [...new Set(holdings.map((h) => h.coin_id))]) {
    if (!currentPrices[coinId]) {
      const [dbPrice] = await db
        .select()
        .from(marketPrices)
        .where(eq(marketPrices.asset_id, coinId))
        .orderBy(desc(marketPrices.last_updated))
        .limit(1);
      if (dbPrice) {
        currentPrices[coinId] = {
          price_usd: dbPrice.price_usd,
          price_thb: dbPrice.price_thb,
          change_24h: dbPrice.change_24h,
        };
      }
    }
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
