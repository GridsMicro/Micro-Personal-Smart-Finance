import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.binance.th/api/v3/ticker/24hr", {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store"
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: res.status });
    }
    
    const data = await res.json();
    const tickers = data.data || [];
    
    // Get top 10 THB pairs by volume
    const thbPairs = tickers
      .filter((t: any) => t.symbol?.endsWith("THB"))
      .sort((a: any, b: any) => parseFloat(b.volume) - parseFloat(a.volume))
      .slice(0, 10)
      .map((t: any) => ({
        symbol: t.symbol,
        price: parseFloat(t.lastPrice).toLocaleString("th-TH", { style: "currency", currency: "THB" }),
        change: parseFloat(t.priceChangePercent).toFixed(2) + "%"
      }));
    
    // Format as text for terminal-like display
    const output = [
      "==========================================",
      "  BINANCE TH - Crypto Prices (THB)",
      "==========================================",
      "",
      `Found ${thbPairs.length} THB trading pairs`,
      "",
      "------------------------------------------",
      "Symbol        | Price (THB)     | Change",
      "------------------------------------------",
      ...thbPairs.map((p: any) => `${p.symbol.padEnd(13)}| ${p.price.padEnd(15)}| ${p.change}`),
      "------------------------------------------",
      "",
      `Total pairs fetched: ${tickers.length}`,
      "Source: Binance TH (api.binance.th)",
      "=========================================="
    ].join("\n");
    
    return new NextResponse(output, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
