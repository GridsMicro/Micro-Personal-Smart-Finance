// Server Component - fetches directly during SSR
export default async function BinanceTerminalPage() {
  let output = "";
  
  const symbols = ["BTCTHB", "ETHTHB", "BNBTHB", "XRPTHB", "ADATHB"];
  
  try {
    // Fetch all symbols in parallel
    const fetchPromises = symbols.map(async (symbol) => {
      try {
        const res = await fetch(`https://api.binance.th/api/v1/ticker/24hr?symbol=${symbol}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
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
    const tickers = results.filter(r => r !== null);
      
      const thbPairs = tickers.slice(0, 10);
      
      const lines = [
        "==========================================",
        "  BINANCE TH - Crypto Prices (THB)",
        "==========================================",
        "",
        `Found ${thbPairs.length} THB trading pairs`,
        "",
        "------------------------------------------",
        "Symbol        | Price (THB)     | Change",
        "------------------------------------------",
      ];
      
      thbPairs.forEach((pair: any) => {
        const symbol = pair.symbol.padEnd(13);
        const price = parseFloat(pair.lastPrice).toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).padEnd(15);
        const change = parseFloat(pair.priceChangePercent);
        const changeStr = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
        lines.push(`${symbol}| ${price}| ${changeStr}`);
      });
      
      lines.push("------------------------------------------");
      lines.push("");
      lines.push(`Fetched at: ${new Date().toLocaleString("th-TH")}`);
      lines.push("Source: Binance TH (api.binance.th)");
      lines.push("==========================================");
      
      output = lines.join("\n");
  } catch (error) {
    output = `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
  
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8">
      <h1 className="text-xl mb-4 border-b border-green-400 pb-2">
        Binance TH Terminal Output (Server-Side Fetch)
      </h1>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">
        {output}
      </pre>
    </div>
  );
}
