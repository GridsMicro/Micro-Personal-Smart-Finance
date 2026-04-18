-- Migration: Add explicit BTC, TRX and total fields to special_portfolio_snapshots

ALTER TABLE public.special_portfolio_snapshots
  ADD COLUMN IF NOT EXISTS btc_price_thb numeric(36,18);

ALTER TABLE public.special_portfolio_snapshots
  ADD COLUMN IF NOT EXISTS trx_price_thb numeric(36,18);

ALTER TABLE public.special_portfolio_snapshots
  ADD COLUMN IF NOT EXISTS total_thb numeric(36,18);

-- Backfill total_thb from existing total_value_thb where null
UPDATE public.special_portfolio_snapshots
SET total_thb = total_value_thb
WHERE total_thb IS NULL AND total_value_thb IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_special_portfolio_snapshots_recorded_at ON public.special_portfolio_snapshots(recorded_at);
