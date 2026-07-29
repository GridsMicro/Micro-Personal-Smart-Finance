import DCACharts from "./DCACharts";

type YearResult = {
  year: number;
  chartPoints: { date: string; value: number; invested: number }[];
  transactions: { date: string; price: number; amount: number }[];
  summary: { invested: number; finalValue: number; profit: number; profitPct: number };
};

async function fetchRangePrices(fromSec: number, toSec: number) {
  // Use per-year range requests but avoid asking range queries for periods older than 365 days
  const from = new Date(fromSec * 1000);
  const to = new Date(toSec * 1000);
  const allPoints: [number, number][] = [];
  const cutoffSec = Math.floor(Date.now() / 1000) - 365 * 24 * 3600;

  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
    const yearFrom = Math.floor(new Date(y, 0, 1).getTime() / 1000);
    const yearTo = Math.floor(new Date(y, 11, 31, 23, 59, 59).getTime() / 1000);
    let effectiveFrom = Math.max(yearFrom, fromSec);
    const effectiveTo = Math.min(yearTo, toSec);

    // If the entire year's range is older than CoinGecko's public 365-day window, skip range API
    if (effectiveTo < cutoffSec) {
      // use per-date history for this year
      const pts = await fetchPerDateForYear(y, fromSec, toSec);
      allPoints.push(...pts);
      continue;
    }

    // If the range overlaps the 365-day cutoff, clamp the from to cutoffSec
    if (effectiveFrom < cutoffSec) effectiveFrom = cutoffSec;

    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=thb&from=${effectiveFrom}&to=${effectiveTo}`;
    try {
      const res = await fetch(url, { cache: "force-cache", next: { revalidate: 86400 } });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // Log at debug level for known range-limit responses
        console.info("CoinGecko range fetch failed for year", y, res.status, text);
        const pts = await fetchPerDateForYear(y, fromSec, toSec);
        allPoints.push(...pts);
        continue;
      }
      const json = await res.json();
      const yearPrices = (json.prices || []) as [number, number][];
      allPoints.push(...yearPrices);
    } catch (err) {
      console.warn("Range fetch error for year", y, err);
      const pts = await fetchPerDateForYear(y, fromSec, toSec);
      allPoints.push(...pts);
    }
  }

  allPoints.sort((a, b) => a[0] - b[0]);
  return allPoints;
}

async function fetchPerDateForYear(year: number, globalFromSec: number, globalToSec: number) {
  const pts: [number, number][] = [];
  for (let m = 0; m < 12; m++) {
    const cur = new Date(year, m, 1);
    if (cur.getTime() / 1000 < globalFromSec || cur.getTime() / 1000 > globalToSec) continue;
    try {
      const dd = String(cur.getDate()).padStart(2, "0");
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const yyyy = String(cur.getFullYear());
      const dateStr = `${dd}-${mm}-${yyyy}`;
      const hurl = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr}&localization=false`;
      const hres = await fetch(hurl, { cache: "force-cache", next: { revalidate: 86400 } });
      if (hres.ok) {
        const hj = await hres.json();
        const price = hj?.market_data?.current_price?.thb;
        if (price) pts.push([cur.getTime(), Number(price)]);
        else console.warn("No price in history response for", dateStr);
      } else {
        console.warn("History fetch failed for", dateStr, hres.status);
      }
    } catch (e) {
      console.error("History fetch error for", cur.toISOString(), e);
    }
  }
  // ensure Dec 31 price for the year if within range
  const sd = new Date(year, 11, 31);
  if (sd.getTime() / 1000 >= globalFromSec && sd.getTime() / 1000 <= globalToSec) {
    try {
      const dd = String(sd.getDate()).padStart(2, "0");
      const mm = String(sd.getMonth() + 1).padStart(2, "0");
      const yyyy = String(sd.getFullYear());
      const dateStr = `${dd}-${mm}-${yyyy}`;
      const hurl = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr}&localization=false`;
      const hres = await fetch(hurl, { cache: "force-cache", next: { revalidate: 86400 } });
      if (hres.ok) {
        const hj = await hres.json();
        const price = hj?.market_data?.current_price?.thb;
        if (price) pts.push([sd.getTime(), Number(price)]);
      }
    } catch (e) {
      console.error("History fetch error for sell date", year, e);
    }
  }
  pts.sort((a, b) => a[0] - b[0]);
  return pts;
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
  // Prefer local mock data to avoid external API calls during development/build.
  try {
    const mock = (await import("../../data/dca-btc-monthly.json")).default as { date: string; price: number }[];
    prices = mock.map((p) => [new Date(p.date).getTime(), p.price]);
  } catch (err) {
    console.warn("Local mock data not found, falling back to live fetch", err);
    try {
      prices = await fetchRangePrices(fromTs, toTs);
    } catch (e) {
      console.error("DCA fetch error:", e);
    }
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
