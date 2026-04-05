-- Migration: Standardize Portfolio Schema
-- Date: 2026-04-05
-- Reason: Fix inconsistent schema between migrations 0001 and 0002

-- Step 1: Check if we need to migrate from old schema (broker_id) to new schema (exchange_type)
DO $$
BEGIN
    -- Check if broker_id column exists (old schema from 0001)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'portfolios' 
        AND column_name = 'broker_id'
    ) THEN
        -- We have the old schema, need to migrate
        
        -- Step 1.1: Create temporary table with data
        CREATE TABLE portfolios_temp AS 
        SELECT 
            id,
            user_id,
            name,
            description,
            broker_id as exchange_type,  -- Map old broker_id to exchange_type
            created_at,
            updated_at
        FROM portfolios;
        
        -- Step 1.2: Drop old table
        DROP TABLE portfolios CASCADE;
        
        -- Step 1.3: Create new table with correct schema
        CREATE TABLE portfolios (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            exchange_type TEXT DEFAULT 'CUSTOM',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
        );
        
        -- Step 1.4: Restore data
        INSERT INTO portfolios (id, user_id, name, description, exchange_type, created_at, updated_at)
        SELECT id, user_id, name, description, COALESCE(exchange_type, 'CUSTOM'), created_at, updated_at
        FROM portfolios_temp;
        
        -- Step 1.5: Drop temp table
        DROP TABLE portfolios_temp;
        
        -- Step 1.6: Reset sequence
        SELECT setval('portfolios_id_seq', COALESCE((SELECT MAX(id) FROM portfolios), 0) + 1, false);
        
    ELSIF NOT EXISTS (
        -- Check if portfolios table exists at all
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'portfolios'
    ) THEN
        -- Table doesn't exist, create new one
        CREATE TABLE portfolios (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            exchange_type TEXT DEFAULT 'CUSTOM',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
        );
    END IF;
END $$;

-- Step 2: Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON portfolios(user_id);

-- Step 3: Ensure portfolio_id column exists in transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'portfolio_id'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS transactions_portfolio_id_idx ON transactions(portfolio_id);
    END IF;
END $$;

-- Step 4: Create function to auto-link transactions to portfolios (idempotent)
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

-- Step 5: Run the function for all existing users to standardize data
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM transactions 
        WHERE user_id IS NOT NULL
    LOOP
        PERFORM create_default_portfolios_for_user(user_record.user_id);
    END LOOP;
END $$;

-- Note: This migration ensures all users share the same standardized schema
-- No per-user schema differences after this migration runs
