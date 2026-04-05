import { NextResponse } from "next/server";

const API_KEYS = {
  coinmarketcap: "8a9724300476473f90e7c46d7f9f1f43",
  ninjas: "6wj8XEnatQQqO9mtygIwbPnVUurU6BW1oxBBsDGY",
  freecrypto: "smdmv7ig8ht6jh0xrei4",
};

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2, delay = 1000): Promise<Response> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, headers, retries - 1, delay * 2);
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, headers, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (!provider) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 });
  }

  try {
    let url = "";
    let headers: Record<string, string> = {};

    switch (provider) {
      case "coinmarketcap":
        url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=10&convert=USD";
        headers = { "X-CMC_PRO_API_KEY": API_KEYS.coinmarketcap };
        break;

      case "freecrypto":
        url = `https://api.freecryptoapi.com/v1/getData?symbol=BTC&token=${API_KEYS.freecrypto}`;
        break;

      case "binanceth":
        url = "https://api.binance.th/api/v3/ticker/24hr";
        break;

      case "bitkub":
        url = "https://api.bitkub.com/api/market/ticker";
        headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
        break;

      case "okx":
        url = "https://www.okx.com/api/v5/market/tickers?instType=SPOT";
        break;

      case "coingecko":
        url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1";
        break;

      case "binanceglobal":
        url = "https://api.binance.com/api/v3/ticker/24hr";
        break;

      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    const res = await fetchWithRetry(url, headers, 2, 1000);
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `API error: ${res.status} ${res.statusText}`, provider },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, provider, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API Proxy Error] ${provider}:`, errorMessage);
    return NextResponse.json(
      { error: errorMessage, provider, type: error instanceof TypeError && error.message.includes('fetch') ? 'NETWORK' : 'UNKNOWN' },
      { status: 500 }
    );
  }
}
