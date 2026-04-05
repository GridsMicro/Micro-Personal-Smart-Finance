-- Migration: Add portfolios table
-- Created manually

CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_broker UNIQUE (user_id, broker_id)
);

CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS portfolios_broker_id_idx ON portfolios(broker_id);
