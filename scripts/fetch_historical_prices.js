#!/usr/bin/env node
const fs = require('fs');

(async () => {
  try {
    const from = 1775001600; // 2026-04-01 00:00:00 UTC
    const to = 1776556800;   // 2026-04-19 00:00:00 UTC (exclusive end)
    const pairs = ['BTC_THB', 'TRX_THB'];
    const results = {};

    for (const pair of pairs) {
      const url = `https://api.bitkub.com/tradingview/history?symbol=${pair}&resolution=1D&from=${from}&to=${to}`;
      console.log(`Fetching ${pair} -> ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Fetch failed for ${pair}: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      // Expect arrays 't' (timestamps) and 'c' (closes)
      const ts = Array.isArray(json.t) ? json.t : [];
      const closes = Array.isArray(json.c) ? json.c : [];
      const map = {};
      const len = Math.min(ts.length, closes.length);
      for (let i = 0; i < len; i++) {
        const date = new Date(ts[i] * 1000).toISOString().slice(0, 10);
        map[date] = Number(closes[i]);
      }
      results[pair] = { raw: json, map };
    }

    // Build array from 2026-04-01 to 2026-04-18 inclusive
    const out = [];
    const start = new Date(Date.UTC(2026, 3, 1)); // months 0-based -> 3 = April
    for (let i = 0; i < 18; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        date: key,
        BTC_THB: results['BTC_THB'].map[key] ?? null,
        TRX_THB: results['TRX_THB'].map[key] ?? null,
      });
    }

    const outPath = 'historical_prices_debug.json';
    fs.writeFileSync(outPath, JSON.stringify({ generated_at: new Date().toISOString(), from: '2026-04-01', to: '2026-04-18', data: out }, null, 2));
    console.log('Wrote', outPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
