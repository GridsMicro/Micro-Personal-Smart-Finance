# Database Schema Standard v2.0

> **Effective Date:** 2026-04-05  
> **Status:** MANDATORY  
> **Applies To:** All environments (dev, staging, production)

## 1. มาตรฐานชื่อตาราง (Table Naming)

| กฎ | ตัวอย่าง | ผิด |
|-----|---------|------|
| พหูพจน์ (plural) | `users`, `portfolios`, `transactions` | ~~`user`~~, ~~`portfolio`~~ |
| snake_case | `daily_snapshots`, `market_prices` | ~~`dailySnapshots`~~ |
| ไม่ใช้คำสงวน PostgreSQL | `accounts` | ~~`account`~~ (ใกล้คำสงวน) |

## 2. มาตรฐานชื่อคอลัมน์ (Column Naming)

| กฎ | ตัวอย่าง | คำอธิบาย |
|-----|---------|---------|
| snake_case | `user_id`, `exchange_type` | ไม่ใช้ camelCase |
| Foreign key | `{table}_id` | `user_id`, `portfolio_id` |
| Timestamp | `created_at`, `updated_at` | ไม่ใช้ `createdAt` |
| Boolean | `is_active`, `is_deleted` | prefix ด้วย `is_` |

## 3. โครงสร้างตารางมาตรฐาน (Standard Schema)

### 3.1 portfolios (Level 2 Standard)

```sql
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

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
```

**ค่าที่รับได้ใน exchange_type:**
- `BINANCE_TH` - Binance Thailand
- `BITKUB` - Bitkub exchange
- `OKX` - OKX exchange
- `METAMASK` - MetaMask wallet
- `LEDGER` - Ledger hardware wallet
- `CUSTOM` - Custom/Other

### 3.2 transactions (Level 2 Standard)

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  broker TEXT NOT NULL DEFAULT 'BINANCE_TH',
  asset TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),           -- Average Buy Price (THB)
  type TEXT NOT NULL,             -- 'DEPOSIT' or 'WITHDRAW'
  note TEXT,                      -- Exchange Rate (THB/USD)
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
```

### 3.3 NextAuth Tables (Standard Adapter)

```sql
-- users (จาก NextAuth adapter)
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMP,
  image TEXT,
  role TEXT DEFAULT 'user'
);

-- accounts (OAuth)
CREATE TABLE accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  PRIMARY KEY (provider, provider_account_id)
);

-- sessions
CREATE TABLE sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- verification_tokens
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);
```

## 4. มาตรฐาน Data Types

| ข้อมูล | Type | ความละเอียด | ตัวอย่าง |
|--------|------|-----------|---------|
| ราคา (THB/USD) | DECIMAL | (20, 8) | 2500000.12345678 |
| จำนวนเหรียญ | DECIMAL | (20, 8) | 0.12345678 BTC |
| มูลค่ารวม | DECIMAL | (20, 2) | ฿2,500,000.00 |
| วันที่ | DATE | - | '2026-04-05' |
| เวลา | TIMESTAMP | - | '2026-04-05 14:30:00' |
| JSON | JSONB | - | {"BTC": 0.5, "ETH": 2.0} |

## 5. มาตรฐาน Constraints

### 5.1 Unique Constraints
```sql
-- ผู้ใช้หนึ่งคนมีชื่อ portfolio ไม่ซ้ำกัน
CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)

-- วันละหนึ่งราคาเหรียญ
CONSTRAINT unique_date_asset UNIQUE (date, asset)

-- วันละหนึ่ง snapshot ต่อ user
CONSTRAINT unique_user_date UNIQUE (user_id, date)
```

### 5.2 Foreign Key Rules
```sql
-- ON DELETE CASCADE: ลบ parent → ลบ children อัตโนมัติ
portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE

-- ON DELETE RESTRICT: ห้ามลบ parent ถ้ามี children (default)
user_id TEXT REFERENCES users(id)
```

## 6. มาตรฐาน Migration

### 6.1 ชื่อไฟล์
```
0001_descriptive_name.sql
0002_next_migration.sql
0003_standardize_portfolio_schema.sql
```

### 6.2 โครงสร้างไฟล์
```sql
-- Migration: [ชื่อ]
-- Date: YYYY-MM-DD
-- Author: [ชื่อ]
-- Reason: [เหตุผล]

-- ส่วน 1: ตรวจสอบและสร้างตาราง (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'new_table'
    ) THEN
        CREATE TABLE new_table (...);
    END IF;
END $$;

-- ส่วน 2: เพิ่ม column (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'existing_table' 
        AND column_name = 'new_column'
    ) THEN
        ALTER TABLE existing_table ADD COLUMN new_column TYPE;
    END IF;
END $$;

-- ส่วน 3: Migrate ข้อมูล (ถ้าจำเป็น)
UPDATE table_name SET new_column = old_column;

-- ส่วน 4: สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- ส่วน 5: Functions (Idempotent)
CREATE OR REPLACE FUNCTION function_name(...) RETURNS ... AS $$
BEGIN
    -- logic
END;
$$ LANGUAGE plpgsql;
```

### 6.3 ห้ามทำ
- ❌ แก้ไข migration ที่รันไปแล้ว
- ❌ ใช้ `DROP TABLE` โดยไม่มี `IF EXISTS`
- ❌ ลบ column ที่มีข้อมูลโดยไม่ migrate
- ❌ เปลี่ยน type ของ column โดยตรง (ต้องสร้าง column ใหม่ → migrate → ลบเก่า)

## 7. Validation Queries

### 7.1 ตรวจสอบ Schema ปัจจุบัน
```sql
-- ดู columns ของตาราง
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'portfolios'
ORDER BY ordinal_position;

-- ดู indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'portfolios';

-- ดู constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'portfolios'::regclass;
```

### 7.2 ตรวจสอบ Data Integrity
```sql
-- ตรวจสอบ orphaned records (transactions ไม่มี portfolio)
SELECT COUNT(*) 
FROM transactions 
WHERE portfolio_id IS NULL;

-- ตรวจสอบ duplicate portfolio names
SELECT user_id, name, COUNT(*)
FROM portfolios
GROUP BY user_id, name
HAVING COUNT(*) > 1;

-- ตรวจสอบ foreign key integrity
SELECT t.id, t.portfolio_id
FROM transactions t
LEFT JOIN portfolios p ON t.portfolio_id = p.id
WHERE p.id IS NULL AND t.portfolio_id IS NOT NULL;
```

## 8. การ Deploy Migration

### 8.1 Development
```bash
# รันผ่าน drizzle-kit
npx drizzle-kit push

# หรือรัน SQL ตรงๆ
psql $DATABASE_URL -f app/db/migrations/0003_standardize_portfolio_schema.sql
```

### 8.2 Production
```bash
# 1. สำรองข้อมูลก่อน
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. รัน migration ในขณะที่แอพหยุดทำงาน (maintenance mode)
psql $DATABASE_URL -f app/db/migrations/0003_standardize_portfolio_schema.sql

# 3. ตรวจสอบผลลัพธ์
psql $DATABASE_URL -c "SELECT * FROM portfolios LIMIT 5;"
```

## 9. ปัญหาที่พบบ่อย

### 9.1 Migration ล้มเหลว
```sql
-- ตรวจสอบว่า transaction ค้างอยู่หรือไม่
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';

-- ยกเลิก transaction ค้าง
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';
```

### 9.2 Column ไม่ตรงกับ schema.ts
```sql
-- ตรวจสอบความแตกต่าง
\d portfolios
\d transactions
```

## 10. References

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [PostgreSQL Naming Conventions](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Neon Serverless PostgreSQL](https://neon.tech/docs/)

---

**Last Updated:** 2026-04-05  
**Document Owner:** Database Architecture Team  
**Review Cycle:** Every 6 months
