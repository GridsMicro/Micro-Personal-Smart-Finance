import { NextResponse } from "next/server";
import { db } from "../../../db";
import { transactions, dailySnapshots, users } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Simple auth check for internal cron
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return new Response('Unauthorized', { status: 401 });
    // For now, let it pass for development
  }

  try {
    console.log("🚀 Starting Daily Snapshot Cron (6:00 AM)...");

    // 1. Fetch current prices
    const symbols = ["BTC", "ETH", "SOL", "USDT", "XRP", "DOGE", "ADA", "USDC", "ORDI", "MOODENG", "GOAT", "AVAX", "SATS", "BNB", "DOT", "NEAR", "TRX", "LINK", "MATIC"];
    
    // Fetch prices (reuse logic from ticker API)
    const [binanceThRes, bitkubRes, okxRes, fxRes] = await Promise.all([
      fetch("https://api.binance.th/api/v3/ticker/price").then(r => r.json()),
      fetch("https://api.bitkub.com/api/market/ticker").then(r => r.json()),
      fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT").then(r => r.json()),
      fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json())
    ]);

    const activeRate = fxRes?.rates?.THB || 35;
    const marketMap: any = { binance: {}, bitkub: {}, okx: {} };

    // Process Binance TH
    if (Array.isArray(binanceThRes)) {
      binanceThRes.forEach((item: any) => {
        if (item.symbol.endsWith("THB")) {
          const coin = item.symbol.replace("THB", "");
          marketMap.binance[coin] = parseFloat(item.price);
        }
      });
    }

    // Process Bitkub
    symbols.forEach(coin => {
      const key = `THB_${coin}`;
      if (bitkubRes[key]) marketMap.bitkub[coin] = bitkubRes[key].last;
    });

    // Process OKX
    if (okxRes.data && Array.isArray(okxRes.data)) {
      okxRes.data.forEach((item: any) => {
        if (item.instId.endsWith("-USDT")) {
          const coin = item.instId.replace("-USDT", "");
          marketMap.okx[coin] = parseFloat(item.last);
        }
      });
    }

    // 2. Process each user's portfolio
    const allUsers = await db.select().from(users);
    const today = new Date().toISOString().split("T")[0];

    for (const user of allUsers) {
      const userTxs = await db.select().from(transactions).where(eq(transactions.userId, user.id));
      
      // Calculate Holdings
      const holdings: Record<string, { amount: number, broker: string }> = {};
      userTxs.forEach(tx => {
        const key = `${tx.broker}_${tx.asset}`;
        if (!holdings[key]) holdings[key] = { amount: 0, broker: tx.broker };
        if (tx.type === "DEPOSIT") holdings[key].amount += parseFloat(tx.amount);
        else holdings[key].amount -= parseFloat(tx.amount);
      });

      // Calculate Total Value in THB
      let totalValueTHB = 0;
      Object.entries(holdings).forEach(([_, item]) => {
        const asset = (item as any).asset || _.split("_")[1];
        const broker = item.broker;
        const amount = item.amount;

        // Price Logic
        let price = 0;
        const src = broker.toLowerCase().replace("_th", "");
        if (marketMap[src] && marketMap[src][asset]) {
          price = marketMap[src][asset];
          if (src === "okx") price *= activeRate; // OKX is USD
        } else if (marketMap.bitkub[asset]) {
           price = marketMap.bitkub[asset];
        } else if (marketMap.binance[asset]) {
           price = marketMap.binance[asset];
        } else if (asset === "USDT" || asset === "USDC") {
           price = activeRate;
        }

        totalValueTHB += (amount * price);
      });

      // 3. Save snapshot with individual holdings
      if (totalValueTHB > 0) {
        // Prepare simplified holdings for tracking (e.g. {BTC: 0.5, ETH: 1.2})
        const simpleHoldings: Record<string, number> = {};
        Object.entries(holdings).forEach(([_, item]) => {
           const asset = (item as any).asset || _.split("_")[1];
           simpleHoldings[asset] = (simpleHoldings[asset] || 0) + item.amount;
        });

        await db.insert(dailySnapshots).values({
          userId: user.id,
          totalValue: totalValueTHB.toFixed(2),
          holdingsJson: simpleHoldings,
          fiatCode: "THB",
          date: today
        }).onConflictDoUpdate({
          target: [dailySnapshots.userId, dailySnapshots.date],
          set: { 
            totalValue: totalValueTHB.toFixed(2),
            holdingsJson: simpleHoldings
          }
        });
      }
    }

    return NextResponse.json({ success: true, date: today });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
