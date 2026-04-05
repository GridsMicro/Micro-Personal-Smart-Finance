// Simple test to verify Binance TH API works
// Run with: node test-binance.mjs

fetch("https://api.binance.th/api/v3/ticker/24hr")
  .then(res => {
    console.log("Status:", res.status);
    return res.json();
  })
  .then(data => {
    console.log("\n=== Response Type ===");
    console.log("Is Array:", Array.isArray(data));
    console.log("Has data property:", data.hasOwnProperty("data"));
    
    if (data.data && Array.isArray(data.data)) {
      console.log("\n=== THB Pairs (first 5) ===");
      const thbPairs = data.data
        .filter(item => item.symbol.endsWith("THB"))
        .slice(0, 5);
      
      thbPairs.forEach((pair, i) => {
        console.log(`${i + 1}. ${pair.symbol}: ฿${parseFloat(pair.lastPrice).toLocaleString()}`);
      });
      
      console.log(`\nTotal THB pairs: ${data.data.filter(item => item.symbol.endsWith("THB")).length}`);
      console.log("✅ SUCCESS - Binance TH API is working!");
    } else if (Array.isArray(data)) {
      console.log("\n=== Direct Array Response ===");
      const thbPairs = data
        .filter(item => item.symbol.endsWith("THB"))
        .slice(0, 5);
      
      thbPairs.forEach((pair, i) => {
        console.log(`${i + 1}. ${pair.symbol}: ฿${parseFloat(pair.lastPrice).toLocaleString()}`);
      });
      
      console.log(`\nTotal THB pairs: ${data.filter(item => item.symbol.endsWith("THB")).length}`);
      console.log("✅ SUCCESS - Binance TH API is working!");
    } else {
      console.log("\n❌ Unexpected response format:");
      console.log(JSON.stringify(data, null, 2).slice(0, 500));
    }
  })
  .catch(err => {
    console.error("❌ Error:", err.message);
  });
