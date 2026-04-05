import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const symbols = ["BTC", "ETH", "SOL", "USDT", "XRP", "DOGE", "ADA", "USDC", "ORDI", "MOODENG", "GOAT", "AVAX", "SATS", "BNB", "DOT", "NEAR", "TRX", "LINK", "MATIC"];
    
    // Fetch from multiple sources in parallel
    const [binanceThRes, bitkubRes, okxRes, coinGeckoRes] = await Promise.allSettled([
      fetch("https://api.binance.th/api/v3/ticker/price", { next: { revalidate: 10 } }),
      fetch("https://api.bitkub.com/api/market/ticker", { next: { revalidate: 10 } }),
      fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", { 
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(3500)
      }),
      // [ADDED: 2026-04-05] CoinGecko for global average price (Wallet/CUSTOM types)
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether,ripple,dogecoin,cardano,usd-coin,ordinals,moo-deng,goat-token,avalanche-2,binancecoin,polkadot,near,tron,chainlink,matic-network&vs_currencies=thb", {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000)
      })
    ]);

    // Handle the statuses without crashing on ENOTFOUND
    const logData: any = {
       binanceTH: binanceThRes.status,
       bitkub: bitkubRes.status,
       coinGecko: coinGeckoRes.status,
    };
    if (okxRes.status === 'rejected') {
       console.log("OKX Fetch Failed (likely DNS/Blocked):", okxRes.reason?.message);
       logData.okx = "failed_or_blocked";
    } else {
       logData.okx = okxRes.value.ok ? "fulfilled" : "http_error";
    }
    console.log("Tickers Fetch Status:", logData);

    const results: any = {
      binance: {},
      bitkub: {},
      okx: {},
      coingecko: {}, // [ADDED: 2026-04-05] Global average price for Wallet/CUSTOM types
      usdthb: 35.0,
      timestamp: new Date().toISOString(),
    };

    // Fetch USD/THB exchange rate
    try {
      const fxRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: AbortSignal.timeout(3000)
      });
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        if (fxData.rates?.THB) {
          results.usdthb = fxData.rates.THB;
        }
      }
    } catch (e) {
      console.log("FX fetch failed, using default:", e);
    }

    // 1. Process Binance TH (THB Prices)
    if (binanceThRes.status === "fulfilled" && binanceThRes.value.ok) {
      try {
        const data = await binanceThRes.value.json();
        console.log("[TICKER DEBUG] Binance TH response:", data.slice(0, 5));
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item.symbol.endsWith("THB")) {
              const coin = item.symbol.replace("THB", "");
              if (symbols.includes(coin)) {
                results.binance[coin] = parseFloat(item.price);
                console.log(`[TICKER DEBUG] Binance TH: ${coin} = ${item.price}`);
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

    // 4. Process CoinGecko (Global THB Prices for Wallet/CUSTOM types)
    if (coinGeckoRes.status === "fulfilled" && coinGeckoRes.value.ok) {
      try {
        const data = await coinGeckoRes.value.json();
        // Map CoinGecko IDs to our symbol format
        const idToSymbol: Record<string, string> = {
          "bitcoin": "BTC",
          "ethereum": "ETH",
          "solana": "SOL",
          "tether": "USDT",
          "ripple": "XRP",
          "dogecoin": "DOGE",
          "cardano": "ADA",
          "usd-coin": "USDC",
          "ordinals": "ORDI",
          "moo-deng": "MOODENG",
          "goat-token": "GOAT",
          "avalanche-2": "AVAX",
          "binancecoin": "BNB",
          "polkadot": "DOT",
          "near": "NEAR",
          "tron": "TRX",
          "chainlink": "LINK",
          "matic-network": "MATIC"
        };
        
        Object.entries(data).forEach(([id, prices]: [string, any]) => {
          const symbol = idToSymbol[id];
          if (symbol && prices.thb) {
            results.coingecko[symbol] = prices.thb;
          }
        });
        console.log("[TICKER] CoinGecko prices loaded:", Object.keys(results.coingecko).length, "assets");
      } catch (e) {
        console.error("Error parsing CoinGecko:", e);
      }
    } else {
      console.log("[TICKER] CoinGecko fetch failed:", coinGeckoRes.status);
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
