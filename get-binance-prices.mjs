// Fetch Binance TH prices and save to file
// Run: node get-binance-prices.mjs

import fs from 'fs';

const API_URL = "https://api.binance.th/api/v3/ticker/24hr";
const OUTPUT_FILE = "binance-th-prices.txt";

let output = [];

output.push("==========================================");
output.push("  BINANCE TH - Crypto Prices (THB)");
output.push("==========================================");
output.push("");

fetch(API_URL)
  .then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    const tickers = data.data || [];
    
    if (!Array.isArray(tickers)) {
      output.push("Error: Unexpected response format");
      output.push("Response keys: " + Object.keys(data).join(", "));
      fs.writeFileSync(OUTPUT_FILE, output.join("\n"));
      process.exit(1);
    }
    
    const thbPairs = tickers
      .filter((t) => t.symbol && t.symbol.endsWith("THB"))
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
      .slice(0, 10);
    
    output.push(`Found ${thbPairs.length} THB trading pairs`);
    output.push("");
    output.push("------------------------------------------");
    output.push("Symbol        | Price (THB)     | Change");
    output.push("------------------------------------------");
    
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
      
      output.push(`${symbol}| ${price}| ${changeStr}`);
    });
    
    output.push("------------------------------------------");
    output.push("");
    output.push(`Total pairs fetched: ${tickers.length}`);
    output.push("Source: Binance TH (api.binance.th)");
    output.push("==========================================");
    
    // Write to file and console
    fs.writeFileSync(OUTPUT_FILE, output.join("\n"));
    console.log(output.join("\n"));
    
  })
  .catch((err) => {
    output.push("ERROR: " + err.message);
    output.push("Possible causes:");
    output.push("- Network connection issue");
    output.push("- Binance TH API is down");
    output.push("- Rate limited");
    
    fs.writeFileSync(OUTPUT_FILE, output.join("\n"));
    console.error(output.join("\n"));
    process.exit(1);
  });
