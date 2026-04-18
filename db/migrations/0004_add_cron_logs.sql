-- Migration: Add cron_logs table for audit of cron warm-up and failures

CREATE TABLE IF NOT EXISTS public.cron_logs (
  id serial PRIMARY KEY,
  job varchar(255) NOT NULL,
  attempts integer NOT NULL,
  success boolean NOT NULL,
  message text,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON public.cron_logs(created_at);
