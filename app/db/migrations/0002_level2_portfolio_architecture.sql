-- Migration: Level 2 Portfolio Architecture
-- Date: 2026-04-05

-- Step 1: Create portfolios table as real entity
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exchange_type TEXT DEFAULT 'CUSTOM',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON portfolios(user_id);

-- Step 2: Add portfolio_id to transactions (nullable for migration period)
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS transactions_portfolio_id_idx ON transactions(portfolio_id);

-- Step 3: Create function to auto-create default portfolios for existing brokers
CREATE OR REPLACE FUNCTION create_default_portfolios_for_user(p_user_id TEXT)
RETURNS void AS $$
DECLARE
  broker_record RECORD;
  new_portfolio_id INTEGER;
BEGIN
  -- For each unique broker in transactions without portfolio_id
  FOR broker_record IN 
    SELECT DISTINCT broker 
    FROM transactions 
    WHERE user_id = p_user_id 
    AND portfolio_id IS NULL
  LOOP
    -- Check if portfolio already exists
    SELECT id INTO new_portfolio_id
    FROM portfolios
    WHERE user_id = p_user_id AND name = broker_record.broker;
    
    -- If not exists, create it
    IF new_portfolio_id IS NULL THEN
      INSERT INTO portfolios (user_id, name, exchange_type)
      VALUES (p_user_id, broker_record.broker, broker_record.broker)
      RETURNING id INTO new_portfolio_id;
    END IF;
    
    -- Update transactions to link to this portfolio
    UPDATE transactions
    SET portfolio_id = new_portfolio_id
    WHERE user_id = p_user_id
    AND broker = broker_record.broker
    AND portfolio_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Run this for each user after deployment:
-- SELECT create_default_portfolios_for_user('user_id_here');
