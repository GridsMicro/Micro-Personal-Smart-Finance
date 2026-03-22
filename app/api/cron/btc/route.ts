import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { marketPrices } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const ASSETS = [
  { id: "bitcoin", sym: "BTC" },
  { id: "ethereum", sym: "ETH" },
  { id: "solana", sym: "SOL" },
  { id: "tether", sym: "USDT" }
];

export async function GET() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  
  if (dayOfMonth !== 1) {
    return NextResponse.json({ message: "Not 1st. Skipped." });
  }

  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-01
  const results = [];

  try {
    for (const asset of ASSETS) {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=usd,thb`);
      const data = await res.json();
      
      if (data[asset.id]) {
        const usd = data[asset.id].usd;
        const thb = data[asset.id].thb;
        
        await db.insert(marketPrices).values({
          asset: asset.sym,
          date: dateStr,
          priceUSD: usd.toString(),
          priceTHB: thb.toString(),
          source: "CRON_JOB"
        }).onConflictDoUpdate({
          target: [marketPrices.date, marketPrices.asset],
          set: { priceUSD: usd.toString(), priceTHB: thb.toString() }
        });
        results.push({ asset: asset.sym, success: true });
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
