import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets, marketComparison, exchangeRates } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getThaiTime } from "@/lib/utils/time";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const nowThai = getThaiTime();
    // 1. Fetch current exchange rate (USD/THB)
    const [rateRow] = await db.select().from(exchangeRates).where(eq(exchangeRates.id, "USD_THB")).limit(1);
    const usdtThbRate = rateRow ? Number(rateRow.rate) : 35.0; // Fallback

    // 2. Fetch data from external APIs
    
    // 2.1 Bitkub
    let bitkubPrices: Record<string, number> = {};
    try {
      const bkRes = await fetch("https://api.bitkub.com/api/market/ticker");
      if (bkRes.ok) {
        const data = await bkRes.json();
        Object.keys(data).forEach(pair => {
          if (pair.startsWith("THB_")) {
            const symbol = pair.replace("THB_", "");
            bitkubPrices[symbol] = data[pair].last;
          }
        });
      }
    } catch (e) { console.error("Bitkub fetch error", e); }

    // 2.2 Binance (Top pairs)
    let binancePrices: Record<string, number> = {};
    try {
      const bnRes = await fetch("https://api.binance.com/api/v3/ticker/price");
      if (bnRes.ok) {
        const data = await bnRes.json();
        data.forEach((item: any) => {
          if (item.symbol.endsWith("USDT")) {
            const symbol = item.symbol.replace("USDT", "");
            binancePrices[symbol] = Number(item.price);
          }
        });
      }
    } catch (e) { console.error("Binance fetch error", e); }

    // 2.3 OKX
    let okxPrices: Record<string, number> = {};
    try {
      const okRes = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
      if (okRes.ok) {
        const json = await okRes.json();
        if (json.data) {
          json.data.forEach((item: any) => {
            if (item.instId.endsWith("-USDT")) {
              const symbol = item.instId.replace("-USDT", "");
              okxPrices[symbol] = Number(item.last);
            }
          });
        }
      }
    } catch (e) { console.error("OKX fetch error", e); }

    // 3. Process & Compare
    const activeAssets = await db.select().from(assets).where(eq(assets.is_active, true));
    const analysisResults = [];

    for (const asset of activeAssets) {
      const symbol = asset.symbol.toUpperCase();
      const bkPriceThb = bitkubPrices[symbol];
      const bnPriceUsd = binancePrices[symbol];
      const okxPriceUsd = okxPrices[symbol];

      if (!bnPriceUsd && !okxPriceUsd && !bkPriceThb) continue;

      // Convert Bitkub to USD for comparison
      const bkPriceUsd = bkPriceThb ? bkPriceThb / usdtThbRate : null;
      
      const validPrices = [bkPriceUsd, bnPriceUsd, okxPriceUsd].filter(p => p !== null && p !== undefined) as number[];
      if (validPrices.length === 0) continue;

      const avgPriceUsd = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
      const minPrice = Math.min(...validPrices);
      const maxPrice = Math.max(...validPrices);
      const spread = ((maxPrice - minPrice) / minPrice) * 100;

      let recommendation = "HOLD";
      let note = `Average price: $${avgPriceUsd.toFixed(2)}`;

      if (spread > 1.5) {
        recommendation = "ARBITRAGE";
        const sources = [
          { name: "Bitkub", price: bkPriceUsd },
          { name: "Binance", price: bnPriceUsd },
          { name: "OKX", price: okxPriceUsd }
        ].filter(s => s.price !== null);
        
        const lowest = sources.reduce((prev, curr) => (prev.price! < curr.price!) ? prev : curr);
        const highest = sources.reduce((prev, curr) => (prev.price! > curr.price!) ? prev : curr);
        note = `Opportunity: Buy on ${lowest.name} ($${lowest.price?.toFixed(4)}), Sell on ${highest.name} ($${highest.price?.toFixed(4)}) - Spread: ${spread.toFixed(2)}%`;
      } else if (spread < 0.5) {
        recommendation = "STABLE";
        note = "Prices are highly synchronized across exchanges.";
      }

      const analysisData = {
        asset_id: asset.id,
        symbol: symbol,
        bitkub_price_thb: bkPriceThb?.toString() || null,
        binance_price_usd: bnPriceUsd?.toString() || null,
        okx_price_usd: okxPriceUsd?.toString() || null,
        avg_price_usd: avgPriceUsd.toFixed(18),
        spread_percentage: spread.toFixed(5),
        recommendation,
        analysis_note: note,
        recorded_at: nowThai
      };

      // 4. Save to Database (Upsert style - keeping it simple with insert for now or update latest)
      await db.insert(marketComparison).values(analysisData);
      analysisResults.push(analysisData);
    }

    return NextResponse.json({
      success: true,
      exchange_rate: usdtThbRate,
      timestamp: nowThai.toISOString(),
      count: analysisResults.length,
      data: analysisResults
    });

  } catch (error) {
    console.error("Market analysis error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
