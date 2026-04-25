import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment");
  process.exit(1);
}

try {
  const parsed = new URL(DATABASE_URL);
  console.log(`[db] Using host=${parsed.hostname} port=${parsed.port || 'default'} search=${parsed.search}`);
} catch (err) {
  console.log('[db] Could not parse DATABASE_URL for debugging');
}

const sql = postgres(DATABASE_URL, { prepare: false });

async function wakeDb(maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sql`SELECT 1`;
      console.log(`[wakeDb] DB awake (attempt ${attempt})`);
      return;
    } catch (err: any) {
      console.log(`[wakeDb] DB sleeping, attempt ${attempt}/${maxAttempts} — ${err?.message ?? err}`);
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("Database did not wake after max attempts");
}

function datesBetween(start: Date, end: Date) {
  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

async function fetchBitkubTicker() {
  const res = await fetch("https://api.bitkub.com/api/market/ticker");
  if (!res.ok) throw new Error("Bitkub ticker fetch failed");
  return await res.json();
}

async function run() {
  console.log("Starting special portfolio full re-sync (Apr 1 -> today) — Bitkub THB only");

  await wakeDb(5);

  const start = new Date(Date.UTC(2026, 3, 1)); // April 1, 2026 UTC
  const end = new Date(); // sync up to today
  const dates = datesBetween(start, end);

  // Load special portfolio
  const spRow = await sql`SELECT id FROM special_portfolio WHERE id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1`;
  if (!spRow || spRow.length === 0) throw new Error("Special portfolio not found (id a0000000-0000-0000-0000-000000000001)");
  const spId = spRow[0].id;

  const holdings = await sql`SELECT id, coin_id, amount FROM special_portfolio_holdings WHERE portfolio_id = ${spId}`;
  if (!holdings || holdings.length === 0) console.warn("No holdings found for special portfolio");

  // Idempotent: delete existing special snapshots from start date onward
  await sql`DELETE FROM special_portfolio_snapshots WHERE recorded_at >= ${start.toISOString()}`;
  console.log(`[resync] Deleted existing special snapshots from ${start.toISOString()}`);

  for (const d of dates) {
    const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
    // Use TradingView-compatible Bitkub endpoint to get historical closes for required pairs
    // Endpoint: /tradingview/history?symbol=[PAIR]&resolution=1D&from=1774972800&to=[now]
    const pairsNeeded: string[] = [];
    const symbolMap: Record<string, { holdingId: string; amount: number; coinId: string }> = {};
    for (const h of holdings) {
      const assetMeta = await sql`SELECT symbol FROM assets WHERE id = ${h.coin_id} LIMIT 1`;
      const symbol = assetMeta[0]?.symbol;
      if (!symbol) throw new Error(`Asset metadata missing for ${h.coin_id}`);
      const pair = `${symbol.toUpperCase()}_THB`;
      if (!pairsNeeded.includes(pair)) pairsNeeded.push(pair);
      symbolMap[symbol.toUpperCase()] = { holdingId: h.id, amount: Number(h.amount), coinId: h.coin_id };
    }

    // Ensure BTC and TRX pairs are always fetched for the golden record
    if (!pairsNeeded.includes('BTC_THB')) pairsNeeded.push('BTC_THB');
    if (!pairsNeeded.includes('TRX_THB')) pairsNeeded.push('TRX_THB');

    // Fetch historical closes for each required pair once, then index by date
    const priceByPairDate: Record<string, Record<string, number>> = {};
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = 1774972800; // as requested
    for (const pair of pairsNeeded) {
      const url = `https://api.bitkub.com/tradingview/history?symbol=${pair}&resolution=1D&from=${fromSec}&to=${nowSec}`;
      const started = Date.now();
      const res = await fetch(url);
      const duration = Date.now() - started;
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch (e) { json = null; }

      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after') || res.headers.get('x-ratelimit-reset') || null;
        throw new Error(`Rate limited fetching ${url} retryAfter=${retryAfter}`);
      }
      if (res.status !== 200 || !json) {
        throw new Error(`Failed to fetch tradingview history for ${pair}: status=${res.status}`);
      }

      // Expect arrays 't' (timestamps) and 'c' (closes)
      const ts: number[] = Array.isArray(json.t) ? json.t : [];
      const closes: number[] = Array.isArray(json.c) ? json.c : [];
      if (ts.length !== closes.length) {
        // If arrays mismatch, still map up to min length
      }
      priceByPairDate[pair] = {};
      const len = Math.min(ts.length, closes.length);
      for (let i = 0; i < len; i++) {
        const date = new Date(ts[i] * 1000).toISOString().slice(0,10);
        priceByPairDate[pair][date] = Number(closes[i]);
      }
      console.log(`[resync] Fetched ${len} candles for ${pair} (duration ${duration}ms)`);
    }

    const snapshotHoldings: any[] = [];
    let totalValueThb = 0;

    const dateKey = dayStart.toISOString().slice(0,10);
    for (const [sym, hmeta] of Object.entries(symbolMap)) {
      const pair = `${sym}_THB`;
      const price = priceByPairDate[pair]?.[dateKey];
      if (typeof price === 'undefined') {
        throw new Error(`Missing TradingView close for ${pair} on ${dateKey}`);
      }
      const amount = hmeta.amount;
      const value = amount * price;
      totalValueThb += value;
      snapshotHoldings.push({ holding_id: hmeta.holdingId, coin_id: hmeta.coinId, amount, price_thb: price, value_thb: value });
    }

    // Explicitly fetch BTC and TRX prices for this date (required golden record fields)
    const btcPair = `BTC_THB`;
    const trxPair = `TRX_THB`;
    const btcPrice = priceByPairDate[btcPair]?.[dateKey];
    const trxPrice = priceByPairDate[trxPair]?.[dateKey];
    if (typeof btcPrice === 'undefined') throw new Error(`Missing BTC price for ${dateKey}`);
    if (typeof trxPrice === 'undefined') throw new Error(`Missing TRX price for ${dateKey}`);
    // Upsert: delete existing snapshot for this portfolio/date then insert
    await sql`DELETE FROM special_portfolio_snapshots WHERE portfolio_id = ${spId} AND recorded_at::date = ${dateKey}::date`;
    await sql`INSERT INTO special_portfolio_snapshots (portfolio_id, snapshot_data, btc_price_thb, trx_price_thb, total_value_thb, total_thb, recorded_at) VALUES (
      ${spId},
      ${JSON.stringify({ date: dateKey, holdings: snapshotHoldings })}::jsonb,
      ${btcPrice},
      ${trxPrice},
      ${totalValueThb.toFixed(6)},
      ${totalValueThb.toFixed(6)},
      ${dayEnd}
    )`;

    console.log(`[resync] Upserted snapshot for ${dateKey} total THB=${totalValueThb.toFixed(6)}`);
  }

  // Summary: compute base and current snapshot
  const baseRow = await sql`SELECT total_value_thb FROM special_portfolio_snapshots WHERE recorded_at >= ${start.toISOString()} ORDER BY recorded_at ASC LIMIT 1`;
  const curRow = await sql`SELECT total_value_thb FROM special_portfolio_snapshots WHERE recorded_at <= ${end.toISOString()} ORDER BY recorded_at DESC LIMIT 1`;

  const baseVal = baseRow?.[0]?.total_value_thb ?? null;
  const currentVal = curRow?.[0]?.total_value_thb ?? null;

  console.log('--- Re-sync Summary ---');
  console.log('Base (2026-04-01):', baseVal);
  console.log('Current:', currentVal);
  if (baseVal && currentVal) {
    const gain = (Number(currentVal) - Number(baseVal)) / Number(baseVal) * 100;
    console.log('Percentage change:', gain.toFixed(2) + '%');
  }
}

run().catch((err) => {
  console.error('Resync failed:', err);
  process.exit(1);
});
