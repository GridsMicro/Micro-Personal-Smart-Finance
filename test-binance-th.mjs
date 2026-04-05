// Test script to verify Binance TH API directly
// Run this to test if the API endpoint works

async function testBinanceThDirect() {
  console.log("Testing Binance TH API directly...\n");
  
  try {
    const url = "https://api.binance.th/api/v3/ticker/24hr";
    console.log(`Fetching: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.error(`HTTP Error: ${res.status}`);
      const text = await res.text();
      console.error("Response:", text.slice(0, 200));
      return;
    }
    
    const data = await res.json();
    console.log("\n=== Response Structure ===");
    console.log("Type:", typeof data);
    console.log("Is Array:", Array.isArray(data));
    console.log("Keys:", Object.keys(data));
    
    if (data.code !== undefined) {
      console.log("\nBinance TH Response Format Detected:");
      console.log("- code:", data.code);
      console.log("- msg:", data.msg);
      console.log("- data is array:", Array.isArray(data.data));
      console.log("- timestamp:", data.timestamp);
      
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log("\n=== First 3 THB Pairs ===");
        const thbPairs = data.data.filter((item: any) => 
          item.symbol?.endsWith("THB")
        ).slice(0, 3);
        
        thbPairs.forEach((pair: any, i: number) => {
          console.log(`\n${i + 1}. ${pair.symbol}:`);
          console.log(`   Last Price: ${pair.lastPrice}`);
          console.log(`   Change: ${pair.priceChangePercent}%`);
        });
        
        console.log(`\nTotal THB pairs: ${thbPairs.length}`);
        console.log(`Total all pairs: ${data.data.length}`);
      }
    } else if (Array.isArray(data)) {
      console.log("\nDirect Array Response:");
      console.log("Total items:", data.length);
      const thbPairs = data.filter((item: any) => 
        item.symbol?.endsWith("THB")
      ).slice(0, 3);
      console.log("First 3 THB pairs:", thbPairs.map((p: any) => p.symbol));
    }
    
    console.log("\n✅ API Test PASSED - Binance TH is working!");
    
  } catch (error) {
    console.error("\n❌ API Test FAILED");
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

// Run the test
testBinanceThDirect();
