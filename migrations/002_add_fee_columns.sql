-- Migration: Add fee tracking columns to transactions table
-- Date: 2026-04-08

-- Add fee columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS fee DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS fee_currency TEXT,
ADD COLUMN IF NOT EXISTS fee_percent DECIMAL(5, 2);

-- Create broker_fees table
CREATE TABLE IF NOT EXISTS broker_fees (
    id SERIAL PRIMARY KEY,
    broker_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    spot_maker_fee DECIMAL(5, 3) NOT NULL DEFAULT 0.100,
    spot_taker_fee DECIMAL(5, 3) NOT NULL DEFAULT 0.100,
    withdrawal_fee DECIMAL(20, 8) DEFAULT 0,
    withdrawal_fee_currency TEXT DEFAULT 'THB',
    min_withdrawal DECIMAL(20, 2) DEFAULT 0,
    deposit_fee DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create fee_daily_snapshots table
CREATE TABLE IF NOT EXISTS fee_daily_snapshots (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
    total_fees DECIMAL(20, 2) NOT NULL DEFAULT 0,
    fees_by_broker JSONB NOT NULL DEFAULT '{}',
    fees_by_asset JSONB NOT NULL DEFAULT '{}',
    transaction_count INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, portfolio_id, date)
);

-- Create portfolio_coin_snapshots table
CREATE TABLE IF NOT EXISTS portfolio_coin_snapshots (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    price_thb DECIMAL(20, 8) NOT NULL,
    value_thb DECIMAL(20, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(portfolio_id, asset, date)
);

-- Insert default broker fees
INSERT INTO broker_fees (broker_id, name, spot_maker_fee, spot_taker_fee, withdrawal_fee, withdrawal_fee_currency, deposit_fee, is_active) VALUES
('BINANCE_TH', 'Binance Thailand', 0.100, 0.100, 0, 'THB', 0, TRUE),
('BITKUB', 'Bitkub', 0.250, 0.250, 0, 'THB', 0, TRUE),
('OKX', 'OKX', 0.080, 0.100, 0, 'USD', 0, TRUE),
('METAMASK', 'MetaMask', 0, 0, 0, 'ETH', 0, TRUE)
ON CONFLICT (broker_id) DO NOTHING;
