import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Binance TH /api/v1 requires symbol parameter for ticker/24hr
    const symbols = ["BTCTHB", "ETHTHB", "BNBTHB", "XRPTHB", "ADATHB", "DOGETHB", "MATICTHB", "SOLTHB", "TRXTHB", "DOTTHB"];
    
    // Fetch all symbols in parallel
    const fetchPromises = symbols.map(async (symbol) => {
      try {
        const res = await fetch(`https://api.binance.th/api/v1/ticker/24hr?symbol=${symbol}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          cache: "no-store"
        });
        
        if (res.ok) {
          return await res.json();
        }
        return null;
      } catch {
        return null;
      }
    });
    
    const results = await Promise.all(fetchPromises);
    const thbPairs = results.filter(r => r !== null);
    
    return NextResponse.json({
      success: true,
      thbPairs,
      totalPairs: thbPairs.length,
      thbPairsCount: thbPairs.length,
      symbols: symbols
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
