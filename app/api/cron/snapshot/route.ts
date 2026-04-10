import { NextResponse } from "next/server";
import { db } from "../../../db";
import { transactions, dailySnapshots, users, portfolioCoinSnapshots, feeDailySnapshots } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// 🛡️ CRON_SECRET for security
const CRON_SECRET = process.env.CRON_SECRET || "master-planner-secret-2026";

export async function GET(req: Request) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const symbols = ["BTC", "ETH", "SOL", "USDT", "XRP", "DOGE", "ADA", "USDC", "ORDI", "MOODENG", "GOAT", "AVAX", "SATS", "BNB", "DOT", "NEAR", "TRX", "LINK", "MATIC"];
    
    // 2. Pulling Price (Standard Application Logic)
    const [binanceThRes, bitkubRes, okxRes, fxRes] = await Promise.allSettled([
      fetch("https://api.binance.th/api/v3/ticker/price").then(r => r.json()),
      fetch("https://api.bitkub.com/api/market/ticker").then(r => r.json()),
      fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", { signal: AbortSignal.timeout(3500) }).then(r => r.json()),
      fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json())
    ]);

    const usdRate = (fxRes.status === "fulfilled" ? fxRes.value?.rates?.THB : 36) || 36;
    const marketMap: any = { binance: {}, bitkub: {}, okx: {} };

    if (binanceThRes.status === "fulfilled") {
      binanceThRes.value.forEach((item: any) => {
        if (item.symbol.endsWith("THB")) {
          const coin = item.symbol.replace("THB", "");
          if (symbols.includes(coin)) marketMap.binance[coin] = parseFloat(item.price);
        }
      });
    }

    if (bitkubRes.status === "fulfilled") {
      symbols.forEach(coin => {
        const key = `THB_${coin}`;
        if (bitkubRes.value[key]) marketMap.bitkub[coin] = bitkubRes.value[key].last;
      });
    }

    if (okxRes.status === "fulfilled" && okxRes.value.data) {
      okxRes.value.data.forEach((item: any) => {
        if (item.instId.endsWith("-USDT")) {
          const coin = item.instId.replace("-USDT", "");
          if (symbols.includes(coin)) marketMap.okx[coin] = parseFloat(item.last);
        }
      });
    }

    // 3. Process Daily Snapshot for Each User (Value + Quantity)
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const userTxs = await db.select().from(transactions).where(eq(transactions.userId, user.id));
      
      const holdings: Record<string, number> = {};
      const brokerHoldings: Record<string, { amount: number, broker: string, asset: string }> = {};

      userTxs.forEach(tx => {
        const amt = parseFloat(tx.amount || "0");
        const bKey = `${tx.broker}_${tx.asset}`;
        if (!holdings[tx.asset]) holdings[tx.asset] = 0;
        if (!brokerHoldings[bKey]) brokerHoldings[bKey] = { amount: 0, broker: tx.broker, asset: tx.asset };
        
        if (tx.type === "DEPOSIT") {
           holdings[tx.asset] += amt;
           brokerHoldings[bKey].amount += amt;
        } else {
           holdings[tx.asset] -= amt;
           brokerHoldings[bKey].amount -= amt;
        }
      });

      // 3.1 Group by portfolioId for coin-level snapshots
      const portfolioHoldings: Record<number, Record<string, { amount: number; broker: string }>> = {};
      
      userTxs.forEach(tx => {
        const portfolioId = tx.portfolioId;
        if (!portfolioId) return; // Skip if no portfolioId
        
        if (!portfolioHoldings[portfolioId]) {
          portfolioHoldings[portfolioId] = {};
        }
        
        if (!portfolioHoldings[portfolioId][tx.asset]) {
          portfolioHoldings[portfolioId][tx.asset] = { amount: 0, broker: tx.broker };
        }
        
        const amt = parseFloat(tx.amount || "0");
        if (tx.type === "DEPOSIT") {
          portfolioHoldings[portfolioId][tx.asset].amount += amt;
        } else {
          portfolioHoldings[portfolioId][tx.asset].amount -= amt;
        }
      });

      // 3.1 Group by portfolioId for coin-level snapshots
      const portfolioHoldings: Record<number, Record<string, { amount: number; broker: string }>> = {};
      
      userTxs.forEach(tx => {
        const portfolioId = tx.portfolioId;
        if (!portfolioId) return; // Skip if no portfolioId
        
        if (!portfolioHoldings[portfolioId]) {
          portfolioHoldings[portfolioId] = {};
        }
        
        if (!portfolioHoldings[portfolioId][tx.asset]) {
          portfolioHoldings[portfolioId][tx.asset] = { amount: 0, broker: tx.broker };
        }
        
        const amt = parseFloat(tx.amount || "0");
        if (tx.type === "DEPOSIT") {
          portfolioHoldings[portfolioId][tx.asset].amount += amt;
        } else {
          portfolioHoldings[portfolioId][tx.asset].amount -= amt;
        }
      });

      // Calculate Net Worth based on the original Dashboard logic
      let netWorthTHB = 0;
      Object.entries(brokerHoldings).forEach(([_, item]) => {
        const asset = item.asset;
        const broker = item.broker;
        const amount = item.amount;

        let price = 0;
        const src = broker.toLowerCase().replace("_th", "");
        if (marketMap[src] && marketMap[src][asset]) {
          price = marketMap[src][asset];
          if (src === "okx") price *= usdRate;
        } else if (marketMap.bitkub[asset]) {
          price = marketMap.bitkub[asset];
        } else if (marketMap.binance[asset]) {
          price = marketMap.binance[asset];
        } else if (asset === "USDT" || asset === "USDC") {
          price = usdRate;
        } else if (asset === "THB") {
          price = 1;
        }

        netWorthTHB += (amount * price);
      });

      // 3.2 Save daily snapshot (user level)
      if (Object.keys(holdings).length > 0) {
        await db.insert(dailySnapshots).values({
          userId: user.id,
          totalValue: netWorthTHB.toFixed(2),
          holdingsJson: holdings,
          fiatCode: "THB",
          date: today
        }).onConflictDoUpdate({
          target: [dailySnapshots.userId, dailySnapshots.date],
          set: {
            totalValue: netWorthTHB.toFixed(2),
            holdingsJson: holdings
          }
        });
      }

      // 3.3 Save coin-level snapshots per portfolio
      for (const [portfolioIdStr, assets] of Object.entries(portfolioHoldings)) {
        const portfolioId = parseInt(portfolioIdStr);
        
        for (const [asset, data] of Object.entries(assets)) {
          const amount = data.amount;
          if (Math.abs(amount) < 0.000001) continue; // Skip zero balances
          
          // Calculate price
          const broker = data.broker;
          let price = 0;
          const src = broker.toLowerCase().replace("_th", "");
          if (marketMap[src] && marketMap[src][asset]) {
            price = marketMap[src][asset];
            if (src === "okx") price *= usdRate;
          } else if (marketMap.bitkub[asset]) {
            price = marketMap.bitkub[asset];
          } else if (marketMap.binance[asset]) {
            price = marketMap.binance[asset];
          } else if (asset === "USDT" || asset === "USDC") {
            price = usdRate;
          } else if (asset === "THB") {
            price = 1;
          }
          
          const valueThb = amount * price;
          
          await db.insert(portfolioCoinSnapshots).values({
            portfolioId,
            userId: user.id,
            asset,
            amount: amount.toFixed(8),
            priceThb: price.toFixed(8),
            valueThb: valueThb.toFixed(2),
            date: today
          }).onConflictDoUpdate({
            target: [portfolioCoinSnapshots.portfolioId, portfolioCoinSnapshots.asset, portfolioCoinSnapshots.date],
            set: {
              amount: amount.toFixed(8),
              priceThb: price.toFixed(8),
              valueThb: valueThb.toFixed(2)
            }
          });
        }
      }

      // 3.4 Save fee snapshots
      const feeTxs = await db.select().from(transactions).where(eq(transactions.userId, user.id)).where(eq(transactions.type, 'FEE'));
      const feeHoldings: Record<string, number> = {};
      feeTxs.forEach(tx => {
        const amt = parseFloat(tx.amount || "0");
        if (!feeHoldings[tx.asset]) feeHoldings[tx.asset] = 0;
        feeHoldings[tx.asset] += amt;
      });
      for (const [asset, amount] of Object.entries(feeHoldings)) {
        const price = marketMap.bitkub[asset] || marketMap.binance[asset] || (asset === "USDT" ? usdRate : 1);
        const valueThb = amount * price;
        await db.insert(feeDailySnapshots).values({
          userId: user.id,
          asset,
          amount: amount.toFixed(8),
          priceThb: price.toFixed(8),
          valueThb: valueThb.toFixed(2),
          date: today
        }).onConflictDoUpdate({
          target: [feeDailySnapshots.userId, feeDailySnapshots.asset, feeDailySnapshots.date],
          set: {
            amount: amount.toFixed(8),
            priceThb: price.toFixed(8),
            valueThb: valueThb.toFixed(2)
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      date: today,
      message: "Daily snapshots + coin-level portfolio snapshots + fee snapshots completed"
    });

  } catch (error: any) {
    console.error("6AM CRON MASTER FAILED:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
