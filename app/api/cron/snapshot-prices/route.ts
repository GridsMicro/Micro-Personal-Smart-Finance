import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { dailySnapshots, assets } from "@/app/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// ============ PRICE FETCHING FUNCTIONS ============

async function fetchBinanceTHPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.binance.th/api/v1/ticker/24hr");
    const data = await response.json();
    const prices: Record<string, number> = {};

    data.forEach((ticker: any) => {
      if (ticker.symbol.endsWith("THB")) {
        const asset = ticker.symbol.replace("THB", "");
        prices[asset] = parseFloat(ticker.lastPrice);
      }
    });

    return prices;
  } catch (error) {
    console.error("[CRON] Failed to fetch Binance TH prices:", error);
    return {};
  }
}

async function fetchBitkubPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.bitkub.com/api/market/ticker");
    const data = await response.json();
    const prices: Record<string, number> = {};

    Object.entries(data).forEach(([pair, info]: [string, any]) => {
      if (pair.endsWith("_thb")) {
        const asset = pair.replace("_thb", "").toUpperCase();
        prices[asset] = info.last;
      }
    });

    return prices;
  } catch (error) {
    console.error("[CRON] Failed to fetch Bitkub prices:", error);
    return {};
  }
}

async function fetchOKXPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
    const data = await response.json();
    const prices: Record<string, number> = {};

    data.data.forEach((ticker: any) => {
      if (ticker.instId.endsWith("-USDT")) {
        const asset = ticker.instId.replace("-USDT", "");
        prices[asset] = parseFloat(ticker.last);
      }
    });

    return prices;
  } catch (error) {
    console.error("[CRON] Failed to fetch OKX prices:", error);
    return {};
  }
}

async function fetchCoinGeckoPrices(): Promise<Record<string, number>> {
  try {
    const assets = [
      "bitcoin", "ethereum", "binancecoin", "solana", "avalanche-2",
      "cardano", "polkadot", "dogecoin", "ripple", "near",
      "ordinals", "moo-deng", "goatseus-maximus", "avex-ai", "sats-ordinals"
    ];

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${assets.join(",")}&vs_currencies=thb`
    );
    const data = await response.json();
    const prices: Record<string, number> = {};

    const mapping: Record<string, string> = {
      "bitcoin": "BTC",
      "ethereum": "ETH",
      "binancecoin": "BNB",
      "solana": "SOL",
      "avalanche-2": "AVAX",
      "cardano": "ADA",
      "polkadot": "DOT",
      "dogecoin": "DOGE",
      "ripple": "XRP",
      "near": "NEAR",
      "ordinals": "ORDI",
      "moo-deng": "MOODENG",
      "goatseus-maximus": "GOAT",
      "avex-ai": "AVEX",
      "sats-ordinals": "SATS"
    };

    Object.entries(data).forEach(([id, info]: [string, any]) => {
      const symbol = mapping[id];
      if (symbol) {
        prices[symbol] = info.thb;
      }
    });

    return prices;
  } catch (error) {
    console.error("[CRON] Failed to fetch CoinGecko prices:", error);
    return {};
  }
}

async function fetchUSDTTHBRate(): Promise<number> {
  try {
    // Try Binance TH first
    const response = await fetch("https://api.binance.th/api/v3/ticker/price?symbol=USDTTHB");
    const data = await response.json();
    return parseFloat(data.price);
  } catch {
    // Fallback to a default rate or alternative source
    return 35.5;
  }
}

// ============ CRON HANDLER ============

export async function GET(request: Request) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting price snapshot at", new Date().toISOString());

    // Fetch prices from all sources
    const [binancePrices, bitkubPrices, okxPrices, coingeckoPrices, usdthbRate] = await Promise.all([
      fetchBinanceTHPrices(),
      fetchBitkubPrices(),
      fetchOKXPrices(),
      fetchCoinGeckoPrices(),
      fetchUSDTTHBRate()
    ]);

    // Merge prices - prioritize: Binance TH > Bitkub > OKX > CoinGecko
    const mergedPrices: Record<string, { binance?: number; bitkub?: number; okx?: number; coingecko?: number }> = {};

    Object.keys({ ...binancePrices, ...bitkubPrices, ...okxPrices, ...coingeckoPrices }).forEach(asset => {
      mergedPrices[asset] = {
        binance: binancePrices[asset],
        bitkub: bitkubPrices[asset],
        okx: okxPrices[asset] ? okxPrices[asset] * usdthbRate : undefined,
        coingecko: coingeckoPrices[asset]
      };
    });

    // Get active assets from database
    const activeAssets = await db.query.assets.findMany({
      where: eq(assets.isActive, true)
    });

    console.log(`[CRON] Active assets: ${activeAssets.length}`);
    console.log(`[CRON] Prices fetched: ${Object.keys(mergedPrices).length} assets`);

    // Store in daily_snapshots as latest prices
    const today = new Date().toISOString().split("T")[0];

    // Check if we already have an entry for today
    const existingSnapshot = await db.query.dailySnapshots.findFirst({
      where: and(
        gte(dailySnapshots.date, today),
        lte(dailySnapshots.date, today + "T23:59:59")
      )
    });

    if (existingSnapshot) {
      // Update existing snapshot with new prices
      await db.update(dailySnapshots)
        .set({
          holdingsJson: mergedPrices,
          updatedAt: new Date()
        })
        .where(eq(dailySnapshots.id, existingSnapshot.id));
    } else {
      // Create new snapshot
      await db.insert(dailySnapshots).values({
        date: new Date(),
        totalValue: 0, // Will be calculated based on user holdings
        holdingsJson: mergedPrices,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log("[CRON] Price snapshot completed successfully");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      assetsCount: Object.keys(mergedPrices).length,
      samplePrices: Object.entries(mergedPrices).slice(0, 5).map(([asset, prices]) => ({
        asset,
        prices
      }))
    });

  } catch (error) {
    console.error("[CRON] Price snapshot failed:", error);
    return NextResponse.json(
      { error: "Failed to snapshot prices", details: String(error) },
      { status: 500 }
    );
  }
}
