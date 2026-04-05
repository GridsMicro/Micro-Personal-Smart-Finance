// Fetch Binance TH prices and display in terminal
// Run: node fetch-binance-th.mjs

const API_URL = "https://api.binance.th/api/v3/ticker/24hr";

console.log("==========================================");
console.log("  BINANCE TH - Crypto Prices (THB)");
console.log("==========================================\n");

fetch(API_URL)
  .then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Binance TH returns { code, msg, data: [...], timestamp }
    const tickers = data.data || [];
    
    if (!Array.isArray(tickers)) {
      console.error("Error: Unexpected response format");
      console.log("Response keys:", Object.keys(data));
      process.exit(1);
    }
    
    // Filter THB pairs and get top 10 by volume
    const thbPairs = tickers
      .filter((t) => t.symbol && t.symbol.endsWith("THB"))
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
      .slice(0, 10);
    
    console.log(`Found ${thbPairs.length} THB trading pairs\n`);
    console.log("------------------------------------------");
    console.log("Symbol        | Price (THB)     | Change");
    console.log("------------------------------------------");
    
    thbPairs.forEach((pair) => {
      const symbol = pair.symbol.padEnd(13);
      const price = parseFloat(pair.lastPrice).toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).padEnd(15);
      
      const change = parseFloat(pair.priceChangePercent);
      const changeStr = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
      const changeColor = change >= 0 ? "\x1b[32m" : "\x1b[31m"; // Green or Red
      const reset = "\x1b[0m";
      
      console.log(`${symbol}| ${price}| ${changeColor}${changeStr}${reset}`);
    });
    
    console.log("------------------------------------------");
    console.log(`\nTotal pairs fetched: ${tickers.length}`);
    console.log("Source: Binance TH (api.binance.th)");
    console.log("==========================================");
    
  })
  .catch((err) => {
    console.error("\n❌ ERROR:", err.message);
    console.log("\nPossible causes:");
    console.log("- Network connection issue");
    console.log("- Binance TH API is down");
    console.log("- Rate limited");
    process.exit(1);
  });
