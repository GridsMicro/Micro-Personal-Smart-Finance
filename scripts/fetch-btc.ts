import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { marketPrices } from "../app/db/schema";
import { and, eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function fetchHistoricalPrices() {
  console.log("🚀 Initializing 5-Year BTC History Injection (Legacy Mode)...");
  
  const years = [2021, 2022, 2023, 2024, 2025];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  for (const year of years) {
    for (const month of months) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
      const dateObj = new Date(dateStr);
      if (dateObj > new Date()) continue; // Skip future dates

      console.log(`📡 Fetching BTC price for ${dateStr}...`);
      
      try {
        const parts = dateStr.split("-");
        const geckDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${geckDate}`);
        const data = await res.json();
        
        if (data.market_data) {
          const usd = data.market_data.current_price.usd;
          const thb = data.market_data.current_price.thb;
          
          await db.insert(marketPrices).values({
            asset: "BTC",
            date: dateStr,
            priceUSD: usd.toString(),
            priceTHB: thb.toString(),
            source: "COINGECKO"
          }).onConflictDoUpdate({
            target: [marketPrices.date, marketPrices.asset],
            set: { priceUSD: usd.toString(), priceTHB: thb.toString() }
          });
          
          console.log(`✅ Stored ${dateStr}: $${usd.toLocaleString()} | ฿${thb.toLocaleString()}`);
        }
        
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`❌ Error fetching ${dateStr}:`, e);
      }
    }
  }
}

fetchHistoricalPrices();
