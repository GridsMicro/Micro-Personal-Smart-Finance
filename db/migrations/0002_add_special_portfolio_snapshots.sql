-- Migration: Add special_portfolio_snapshots table

CREATE TABLE IF NOT EXISTS public.special_portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.special_portfolio(id) ON DELETE cascade,
  snapshot_data jsonb NOT NULL,
  total_value_thb numeric(36,18),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_special_portfolio_snapshots_recorded_at ON public.special_portfolio_snapshots(recorded_at);
