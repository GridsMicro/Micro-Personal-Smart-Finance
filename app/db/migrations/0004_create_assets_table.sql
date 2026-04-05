-- Migration: Create assets table for centralized coin management
-- Date: 2026-04-05
-- Purpose: Store coin list centrally with metadata for price snapshots

-- ============ ASSETS TABLE ============
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,              -- "BTC", "ETH", "SOL"
    name TEXT NOT NULL,                      -- "Bitcoin", "Ethereum"
    type TEXT DEFAULT 'CRYPTO',              -- CRYPTO, STABLECOIN, FIAT
    is_active BOOLEAN DEFAULT true,
    content_path TEXT,                       -- Path to .md file: "content/coins/btc.md"
    official_website TEXT,
    created_by TEXT,                         -- Creator/Founder name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ASSET INFO EXTENSION ============
-- For additional metadata that may change frequently
CREATE TABLE IF NOT EXISTS asset_metadata (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    key TEXT NOT NULL,                      -- Metadata key
    value TEXT,                             -- Metadata value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, key)
);

-- ============ PRICE HISTORY TABLE ============
-- For storing historical price data from cron snapshots
CREATE TABLE IF NOT EXISTS price_snapshots (
    id SERIAL PRIMARY KEY,
    asset_symbol TEXT NOT NULL REFERENCES assets(symbol),
    price_thb DECIMAL(20, 8) NOT NULL,
    source TEXT NOT NULL,                   -- BINANCE_TH, BITKUB, OKX, COINGECKO
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB                          -- Additional price data (volume, change, etc.)
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_is_active ON assets(is_active);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol ON price_snapshots(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_recorded_at ON price_snapshots(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol_time ON price_snapshots(asset_symbol, recorded_at);

-- ============ SEED DATA ============
-- Insert supported assets
INSERT INTO assets (symbol, name, type, content_path, official_website, created_by) VALUES
('THB', 'Thai Baht', 'FIAT', NULL, NULL, 'Bank of Thailand'),
('USDT', 'Tether', 'STABLECOIN', 'content/coins/usdt.md', 'https://tether.to', 'Tether Limited'),
('USDC', 'USD Coin', 'STABLECOIN', 'content/coins/usdc.md', 'https://www.circle.com', 'Circle Consortium'),
('BTC', 'Bitcoin', 'CRYPTO', 'content/coins/btc.md', 'https://bitcoin.org', 'Satoshi Nakamoto'),
('ETH', 'Ethereum', 'CRYPTO', 'content/coins/eth.md', 'https://ethereum.org', 'Vitalik Buterin'),
('BNB', 'Binance Coin', 'CRYPTO', 'content/coins/bnb.md', 'https://www.bnbchain.org', 'Changpeng Zhao'),
('SOL', 'Solana', 'CRYPTO', 'content/coins/sol.md', 'https://solana.com', 'Anatoly Yakovenko'),
('AVAX', 'Avalanche', 'CRYPTO', 'content/coins/avax.md', 'https://www.avax.network', 'Emin Gün Sirer'),
('ADA', 'Cardano', 'CRYPTO', 'content/coins/ada.md', 'https://cardano.org', 'Charles Hoskinson'),
('DOT', 'Polkadot', 'CRYPTO', 'content/coins/dot.md', 'https://polkadot.network', 'Gavin Wood'),
('DOGE', 'Dogecoin', 'CRYPTO', 'content/coins/doge.md', 'https://dogecoin.com', 'Billy Markus & Jackson Palmer'),
('XRP', 'XRP', 'CRYPTO', 'content/coins/xrp.md', 'https://ripple.com/xrp', 'Ripple Labs'),
('NEAR', 'NEAR Protocol', 'CRYPTO', 'content/coins/near.md', 'https://near.org', 'Illia Polosukhin & Alexander Skidanov'),
('ORDI', 'Ordinals', 'CRYPTO', 'content/coins/ordi.md', 'https://ordinals.com', 'Casey Rodarmor'),
('MOODENG', 'Moo Deng', 'CRYPTO', 'content/coins/moodeng.md', NULL, NULL),
('GOAT', 'GOAT', 'CRYPTO', 'content/coins/goat.md', NULL, NULL),
('AVEX', 'AVEX', 'CRYPTO', 'content/coins/avex.md', NULL, NULL),
('SATS', 'Sats', 'CRYPTO', 'content/coins/sats.md', NULL, NULL)
ON CONFLICT (symbol) DO NOTHING;

-- Update daily_snapshots table to reference assets
-- Note: holdings_json structure will be:
-- {
--   "BTC": { "binance": 1500000, "bitkub": 1498000, "okx": 1502000, "coingecko": 1501000 },
--   "ETH": { "binance": 52000, ... }
-- }
