"use server";

import { db } from "../db";
import { assets, marketPrices } from "../db/schema";
import { asc, eq, and } from "drizzle-orm";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";

export async function getMarketHistory(asset: string = "BTC") {
  noStore();
  try {
    const data = await db.select().from(marketPrices)
      .where(eq(marketPrices.asset, asset))
      .orderBy(asc(marketPrices.date));
    return data;
  } catch (e) {
    console.error(`Error fetching Market History for ${asset}:`, e);
    return [];
  }
}

export async function getActiveAssets() {
  noStore();
  try {
    const data = await db.select().from(assets)
      .where(eq(assets.isActive, true))
      .orderBy(asc(assets.symbol));
    return data.map(a => a.symbol);
  } catch (e) {
    console.error("Error fetching active assets:", e);
    return [];
  }
}
