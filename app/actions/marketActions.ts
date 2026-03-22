"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { marketPrices } from "../db/schema";
import { asc, eq, and } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

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
