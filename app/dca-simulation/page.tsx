import DCACharts from "./DCACharts";

type YearResult = {
  year: number;
  chartPoints: { date: string; value: number; invested: number }[];
  transactions: { date: string; price: number; amount: number }[];
  summary: { invested: number; finalValue: number; profit: number; profitPct: number };
};

async function fetchRangePrices(fromSec: number, toSec: number) {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=thb&from=${fromSec}&to=${toSec}`;
  const res = await fetch(url, { cache: "force-cache", next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch price range from CoinGecko");
  const json = await res.json();
  // json.prices is [[timestamp(ms), price], ...]
  return (json.prices || []) as [number, number][];
}

function findClosestPrice(prices: [number, number][], targetMs: number) {
  if (!prices || prices.length === 0) return NaN;
  // binary search for closest timestamp
  let lo = 0;
  let hi = prices.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ts = prices[mid][0];
    if (ts === targetMs) return prices[mid][1];
    if (ts < targetMs) lo = mid + 1;
    else hi = mid - 1;
  }
  // find nearest among lo and hi
  const cand1 = prices[Math.max(0, Math.min(prices.length - 1, lo))];
  const cand2 = prices[Math.max(0, Math.min(prices.length - 1, hi))];
  const d1 = Math.abs((cand1?.[0] || 0) - targetMs);
  const d2 = Math.abs((cand2?.[0] || 0) - targetMs);
  return d1 <= d2 ? cand1[1] : cand2[1];
}

export default async function Page() {
  const now = new Date();
  const endYear = now.getFullYear() - 1; // use last full year
  const startYear = endYear - 4;

  const fromTs = Math.floor(new Date(startYear, 0, 1).getTime() / 1000);
  const toTs = Math.floor(new Date(endYear, 11, 31, 23, 59, 59).getTime() / 1000);

  let prices: [number, number][] = [];
  try {
    prices = await fetchRangePrices(fromTs, toTs);
  } catch (e) {
    console.error("DCA fetch error:", e);
  }

  const results: YearResult[] = [];

  for (let y = startYear; y <= endYear; y++) {
    let btcHeld = 0;
    const transactions: { date: string; price: number; amount: number }[] = [];
    const chartPoints: { date: string; value: number; invested: number }[] = [];

    for (let m = 0; m < 12; m++) {
      const buyDate = new Date(y, m, 1);
      const ts = buyDate.getTime();
      const price = findClosestPrice(prices, ts) || NaN;
      const amount = price ? 100 / price : 0;
      btcHeld += amount;
      transactions.push({ date: buyDate.toISOString().slice(0, 10), price: Number(price.toFixed(2)) || 0, amount: Number(amount.toFixed(8)) });
      const value = btcHeld * (price || 0);
      chartPoints.push({ date: buyDate.toISOString().slice(0, 10), value: Number(value.toFixed(2)), invested: (m + 1) * 100 });
    }

    const sellDate = new Date(y, 11, 31);
    const sellPrice = findClosestPrice(prices, sellDate.getTime()) || NaN;
    const finalValue = btcHeld * (sellPrice || 0);
    const invested = 100 * 12;
    const profit = finalValue - invested;
    const profitPct = invested ? (profit / invested) * 100 : 0;

    results.push({ year: y, chartPoints, transactions, summary: { invested, finalValue: Number(finalValue.toFixed(2)), profit: Number(profit.toFixed(2)), profitPct: Number(profitPct.toFixed(2)) } });
  }

  return (
    <div className="p-6 pt-24">
      <h1 className="text-2xl font-bold mb-4">DCA Simulation (Buy 100 THB BTC on 1st of each month — Sell on Dec 31)</h1>
      <p className="text-sm text-muted-foreground mb-6">Backtest for years {startYear} → {endYear}. Prices sourced from CoinGecko (cached).</p>
      <DCACharts data={results} />
    </div>
  );
}
