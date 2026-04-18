# Architecture Notes

Special Portfolio
- Data source: Bitkub TradingView-compatible endpoint `https://api.bitkub.com/tradingview/history` (permanent).
  - Query pattern: `?symbol=[PAIR]&resolution=1D&from=1774972800&to=[now]` and extract `t` (timestamps) and `c` (close prices).
- All Special Portfolio snapshots are consolidated into the `special_portfolio_snapshots` table.
- Snapshot creation includes a DB readiness loop (5 attempts) to wake the Neon/Postgres connection before writing.

Cron Job
- The daily cron at `/api/cron/record-prices` records market prices and now also upserts the Special Portfolio daily snapshot using the TradingView data source.
- The cron includes a 5-cycle wake-up loop before performing DB writes to prevent transient connection failures.

Cleanup
- Temporary probe scripts and debug cookie logging removed. The system uses Bitkub TradingView data exclusively for Special Portfolio snapshots.

Purpose
- This change ensures deterministic, Bitkub-only historical pricing for the Special Portfolio and isolates its snapshots for reliable year-long HODL analysis.
