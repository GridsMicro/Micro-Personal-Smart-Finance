import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { marketPrices } from "../app/db/schema";
import { count } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function run() {
  const result = await db.select({ value: count() }).from(marketPrices);
  console.log(`📊 TOTAL RECORDS IN market_prices: ${result[0].value}`);
  
  const assets = await db.select({ asset: marketPrices.asset, rows: count() }).from(marketPrices).groupBy(marketPrices.asset);
  console.log("📦 Assets Stats:", assets);
}

run();
