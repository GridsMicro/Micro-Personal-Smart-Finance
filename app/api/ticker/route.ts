import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const symbols = ["BTC", "ETH", "SOL", "USDT", "XRP", "DOGE", "ADA", "USDC", "ORDI", "MOODENG", "GOAT", "AVAX", "SATS", "BNB"];
    
    // Fetch from multiple sources in parallel
    const [binanceThRes, bitkubRes, okxRes] = await Promise.allSettled([
      fetch("https://api.binance.th/api/v3/ticker/price", { next: { revalidate: 10 } }),
      fetch("https://api.bitkub.com/api/market/ticker", { next: { revalidate: 10 } }),
      fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", { next: { revalidate: 10 } }), // Fix plural tickers
    ]);

    console.log("Tickers Fetch Status:", {
       binanceTH: binanceThRes.status,
       bitkub: bitkubRes.status,
       okx: okxRes.status
    });

    const results: any = {
      binance: {}, // Keep key as binance for compatibility but use TH data
      bitkub: {},
      okx: {},
      timestamp: new Date().toISOString(),
    };

    // 1. Process Binance TH (THB Prices)
    if (binanceThRes.status === "fulfilled" && binanceThRes.value.ok) {
      try {
        const data = await binanceThRes.value.json();
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item.symbol.endsWith("THB")) {
              const coin = item.symbol.replace("THB", "");
              if (symbols.includes(coin)) {
                results.binance[coin] = parseFloat(item.price);
              }
            }
          });
        }
      } catch (e) {
        console.error("Error parsing Binance TH:", e);
      }
    }

    // 2. Process Bitkub (THB Prices)
    if (bitkubRes.status === "fulfilled" && bitkubRes.value.ok) {
      try {
        const data = await bitkubRes.value.json();
        symbols.forEach(coin => {
          const key = `THB_${coin}`;
          if (data[key]) {
            results.bitkub[coin] = data[key].last;
          }
        });
      } catch (e) {
        console.error("Error parsing Bitkub:", e);
      }
    }

    // 3. Process OKX (USDT Prices)
    if (okxRes.status === "fulfilled" && okxRes.value.ok) {
       try {
         const data = await okxRes.value.json();
         if (data.data && Array.isArray(data.data)) {
           data.data.forEach((item: any) => {
             if (item.instId.endsWith("-USDT")) {
               const coin = item.instId.replace("-USDT", "");
               if (symbols.includes(coin)) {
                 results.okx[coin] = parseFloat(item.last);
               }
             }
           });
         }
       } catch (e) {
         console.error("Error parsing OKX:", e);
       }
    }

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
