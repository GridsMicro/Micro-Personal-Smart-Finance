// Test Binance TH API
const symbols = ["BTCTHB", "ETHTHB", "BNBTHB"];

async function testAPI() {
  for (const symbol of symbols) {
    try {
      const url = `https://api.binance.th/api/v1/ticker/24hr?symbol=${symbol}`;
      console.log(`Testing: ${url}`);
      
      const res = await fetch(url, {
        headers: { 
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      });
      
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.slice(0, 200)}`);
      console.log("---");
    } catch (e) {
      console.log(`Error for ${symbol}: ${e.message}`);
    }
  }
}

testAPI();
