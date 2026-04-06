import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const symbols = ["BTC", "ETH", "SOL", "USDT", "XRP", "DOGE", "ADA", "USDC", "ORDI", "MOODENG", "GOAT", "AVAX", "SATS", "BNB", "DOT", "NEAR", "TRX", "LINK", "MATIC"];
    
    // Fetch from multiple sources in parallel
    const [binanceThRes, bitkubRes, okxRes, coinGeckoRes, binance24hRes] = await Promise.allSettled([
      fetch("https://api.binance.th/api/v3/ticker/price", { next: { revalidate: 10 } }),
      fetch("https://api.bitkub.com/api/market/ticker", { next: { revalidate: 10 } }),
      fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", { 
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(3500)
      }),
      // CoinGecko for global average price + 24h change + volume
      fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=thb&ids=bitcoin,ethereum,solana,tether,ripple,dogecoin,cardano,usd-coin,ordinals,moo-deng,goat-token,avalanche-2,binancecoin,polkadot,near,tron,chainlink,matic-network&order=market_cap_desc&sparkline=false", {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000)
      }),
      // [ADDED] Binance 24hr ticker for price change and volume
      fetch("https://api.binance.th/api/v3/ticker/24hr", { 
        next: { revalidate: 10 },
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
      coingecko: {},
      coingecko24h: {}, // [ADDED] 24h price change from CoinGecko
      binance24h: {}, // [ADDED] Price change and volume data
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

    // 4. Process CoinGecko Markets API (includes price, 24h change, and volume)
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
        
        // markets API returns array of coin objects
        if (Array.isArray(data)) {
          data.forEach((coin: any) => {
            const symbol = idToSymbol[coin.id];
            if (symbol) {
              // Price in THB
              if (coin.current_price) {
                results.coingecko[symbol] = coin.current_price;
              }
              // 24h price change
              if (coin.price_change_percentage_24h !== undefined && coin.price_change_percentage_24h !== null) {
                results.coingecko24h[symbol] = {
                  priceChangePercent: parseFloat(coin.price_change_percentage_24h),
                };
              }
              // Volume (fallback for when Binance doesn't have data)
              if (coin.total_volume) {
                if (!results.binance24h[symbol]) {
                  results.binance24h[symbol] = {};
                }
                results.binance24h[symbol].quoteVolume = coin.total_volume;
              }
            }
          });
        }
        console.log("[TICKER] CoinGecko markets loaded:", Object.keys(results.coingecko).length, "assets, 24h change:", Object.keys(results.coingecko24h).length);
      } catch (e) {
        console.error("Error parsing CoinGecko markets:", e);
      }
    } else {
      console.log("[TICKER] CoinGecko markets fetch failed:", coinGeckoRes.status);
    }

    // [ADDED] Process Binance 24hr ticker for price change and volume
    if (binance24hRes.status === "fulfilled" && binance24hRes.value.ok) {
      try {
        const data = await binance24hRes.value.json();
        console.log("[TICKER DEBUG] Binance 24hr response count:", data?.length || 0);
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const symbol = item.symbol.replace("THB", "");
            if (symbols.includes(symbol)) {
              // Merge with existing data (preserve CoinGecko volume if Binance doesn't have this coin)
              const existingData = results.binance24h[symbol] || {};
              results.binance24h[symbol] = {
                ...existingData, // Preserve CoinGecko volume data
                priceChange: parseFloat(item.priceChange),
                priceChangePercent: parseFloat(item.priceChangePercent),
                volume: parseFloat(item.volume),
                quoteVolume: parseFloat(item.quoteVolume),
                highPrice: parseFloat(item.highPrice),
                lowPrice: parseFloat(item.lowPrice),
              };
              console.log(`[TICKER DEBUG] Binance 24hr: ${symbol} = ${item.priceChangePercent}%, vol: ${item.quoteVolume}`);
            }
          });
        }
        console.log("[TICKER] Binance 24hr loaded:", Object.keys(results.binance24h).length, "assets");
      } catch (e) {
        console.error("Error parsing Binance 24hr:", e);
      }
    } else {
      console.log("[TICKER] Binance 24hr fetch failed:", binance24hRes.status);
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
