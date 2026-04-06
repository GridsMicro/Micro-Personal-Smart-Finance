# CORE - กติกากลางสำหรับ AI Agents

> **เอกสารนี้เป็น "Single Source of Truth" สำหรับ AI Agents ทุกตัวที่ทำงานในโปรเจกต์**
> 
> **ผู้พัฒนา:** Cascade (GridsMicro Team)
> **เวอร์ชัน:** 1.0.0
> **อัปเดตล่าสุด:** 2026-04-04

---

## 📋 สารบัญ

1. [ภาพรวมโปรเจกต์](#1-ภาพรวมโปรเจกต์)
2. [โครงสร้างโฟลเดอร์](#2-โครงสร้างโฟลเดอร์)
3. [กฎเหล็กที่ต้องปฏิบัติตาม](#3-กฎเหล็กที่ต้องปฏิบัติตาม)
4. [การ Authentication](#4-การ-authentication)
5. [Database & Schema](#5-database--schema)
6. [Server Actions Pattern](#6-server-actions-pattern)
7. [API Routes](#7-api-routes)
8. [การทำงานกับ External APIs](#8-การทำงานกับ-external-apis)
9. [UI/UX Standards](#9-uiux-standards)
10. [Environment Variables](#10-environment-variables)
11. [ขั้นตอนการพัฒนา](#11-ขั้นตอนการพัฒนา)
14. [File Organization Standards](#14-file-organization-standards-new)

---

## 1. ภาพรวมโปรเจกต์

### 1.1 ชื่อโปรเจกต์
**Micro-Personal-Smart-Finance** (ชื่อแสดงผล: "The Smart Planner")

### 1.2 คำอธิบาย
ระบบบริหารจัดการสินทรัพย์ดิจิทัลแบบ Real-time ที่รวมข้อมูลจากหลาย Exchange (Binance TH, Bitkub, OKX) สำหรับบันทึกและติดตามพอร์ตการลงทุน

### 1.3 Tech Stack หลัก
| ส่วนประกอบ | เทคโนโลยี |
|-----------|-----------|
| Framework | Next.js 16.1+ (App Router) |
| Language | TypeScript 5+ |
| Styling | Tailwind CSS 4 |
| Database | Neon Serverless PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js + Google OAuth |
| Charts | Recharts |
| Runtime | Node.js 20+ |

### 1.4 ฟีเจอร์หลัก
- **Portfolio Tracking:** ติดตามสินทรัพย์จากหลาย Exchange ในหน้าเดียว
- **Daily Snapshot:** บันทึกสถานะพอร์ตอัตโนมัติรายวัน
- **Real-time Prices:** ดึงราคาจาก CoinGecko + Exchange APIs
- **Smart Ledger:** บันทึกรายการซื้อ/ขาย/โอน
- **Multi-auth:** Google OAuth (Users) + SuperAdmin (API Service)

---

## 2. โครงสร้างโฟลเดอร์ (Updated 2026-04-06)

```
Micro-Personal-Smart-Finance/
├── .windsurf/              # ค่า config สำหรับ Windsurf IDE (ถ้ามี)
├── app/                    # Next.js App Router
│   ├── actions/            # Server Actions (ทุกการเขียน/อ่าน DB ผ่านตรงนี้)
│   │   ├── authActions.ts      # Auth สำหรับ SuperAdmin
│   │   ├── marketActions.ts    # จัดการข้อมูลตลาด
│   │   └── transactionActions.ts # CRUD ธุรกรรม + Snapshots
│   ├── api/                # API Routes
│   │   ├── auth/[...nextauth]/ # NextAuth config
│   │   ├── cron/               # Cron jobs (BTC price, Daily snapshot)
│   │   └── ticker/             # ราคาเหรียญรวม
│   ├── components/         # React Components ที่ใช้ร่วม
│   │   ├── providers/        # Context providers, AuthGuard
│   │   └── ui/               # UI components (GlassCard, NeonButton)
│   ├── dashboard/          # หน้า Dashboard หลัก
│   │   ├── components/       # Dashboard-specific components
│   │   ├── lib/              # Dashboard utils (constants, priceUtils)
│   │   └── portfolio/        # Portfolio detail pages
│   ├── db/                 # Database config + Schema
│   │   ├── index.ts            # Database connection
│   │   ├── schema.ts           # Table definitions (Drizzle)
│   │   └── migrations/         # SQL migrations
│   ├── lib/                # Shared utilities
│   │   ├── auth-proxy.ts       # Auth proxy (replaces middleware)
│   │   └── utils/              # Utility functions, hooks
│   │       └── hooks/          # Custom hooks (use-toast, etc.)
│   ├── login/              # หน้า Login (moved from app/lib/login/)
│   ├── market/             # หน้าข้อมูลตลาด
│   ├── tools/              # [NEW] Utility/testing pages
│   │   ├── api-test/         # API testing page
│   │   ├── binance-terminal/   # Binance terminal page
│   │   └── market-data/        # Market data tools
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── providers.tsx       # Context providers
├── components/             # (legacy) Components นอก app/ - DEPRECATED
├── public/                 # Static assets
│   └── coins/              # โลโก้เหรียญ (SVG, PNG, WEBP)
├── scripts/                # Utility scripts (ts-node)
│   ├── fetch-all-market.ts
│   ├── fetch-btc.ts
│   └── inspect-db.ts
├── types/                  # TypeScript type definitions
│   └── next-auth.d.ts      # Type extensions สำหรับ NextAuth
├── CORE.md                 # <-- ไฟล์นี้ (กติกากลาง)
├── DATABASE_STANDARD.md    # Database standards
├── ARCHITECTURE.md         # Architecture docs (Auth focused)
├── README.md               # Project overview
├── drizzle.config.ts         # Drizzle ORM config
├── next.config.ts          # Next.js config
├── package.json
├── tsconfig.json
└── vercel.json             # Vercel deployment config
```

### สรุปการเปลี่ยนแปลงโครงสร้าง (2026-04-06)

| ก่อน | หลัง | สถานะ |
|------|------|--------|
| `app/lib/login/page.tsx` | `app/login/page.tsx` | ย้าย |
| `app/lib/auth-guard.tsx` | `app/components/providers/auth-guard.tsx` | ย้าย |
| `app/hooks/use-toast.ts` | `app/lib/utils/hooks/use-toast.ts` | ย้าย |
| `app/api-test/page.tsx` | `app/tools/api-test/page.tsx` | ย้าย |
| `app/binance-terminal/page.tsx` | `app/tools/binance-terminal/page.tsx` | ย้าย |
| `app/market/page.tsx` | `app/tools/market-data/page.tsx` | ย้าย |
| `app/daily/` | ❌ ลบ | ลบทิ้ง |
| `middleware.ts` | ❌ ลบ | ใช้ auth-proxy แทน |

---

## 3. กฎเหล็กที่ต้องปฏิบัติตาม

### 3.1 กฎที่ 1: Server Actions เท่านั้น
**"การเขียน/อ่าน Database ทุกครั้ง ต้องทำผ่าน Server Actions ใน `app/actions/`"**

```typescript
// ✅ ถูกต้อง
// app/actions/transactionActions.ts
"use server";
import { db } from "../db";
export async function getTransactions() { ... }

// app/dashboard/page.tsx
import { getTransactions } from "../actions/transactionActions";
const txs = await getTransactions();
```

```typescript
// ❌ ผิด - ห้ามเขียน DB จาก Client Component โดยตรง
"use client";
const data = await db.select(...); // ผิด!
```

### 3.2 กฎที่ 2: ไม่มีการตรวจสอบ SuperAdmin ฝั่ง Client
**"การตรวจสอบ SuperAdmin ต้องผ่าน API Service กลางเท่านั้น"**

- ห้าม hardcode รหัสผ่านใน Client
- ห้ามตรวจสอบ role ฝั่ง Client โดยไม่ผ่าน Server
- ใช้ `app/actions/authActions.ts` → ยิงไป `API_SERVICE_URL/api/auth/superadmin`

### 3.3 กฎที่ 3: TypeScript Strict
**"ทุกไฟล์ต้องเป็น TypeScript (.ts/.tsx) ไม่มี JavaScript แบบไม่มี type"**

- ไม่ใช้ `any` โดยไม่จำเป็น
- กำหนด type สำหรับ props, returns, database queries
- ใช้ `satisfies` เมื่อจำเป็น

### 3.4 กฎที่ 4: Environment Variables
**"ต้องใช้ผ่าน `process.env.XXX` เท่านั้น ไม่ hardcode secrets"**

Required env vars:
- `DATABASE_URL` - Neon PostgreSQL connection
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXTAUTH_SECRET` - Session encryption
- `API_SERVICE_URL` - Central auth service (default: https://api-service-woad.vercel.app)

### 3.5 กฎที่ 5: Component Organization
**"ใช้ `app/components/` สำหรับ components ใหม่ ไม่ใช่ `components/` นอก app"**

```
app/
  components/          # ✅ ใช้ตรงนี้
    Navbar.tsx
    AssetIcon.tsx
components/            # ❌ Legacy - หลีกเลี่ยง
```

---

## 4. การ Authentication

### 4.1 โครงสร้างการ Auth

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   End Users     │────▶│   Google OAuth   │────▶│   NextAuth      │
│   (JWT Session) │     │   (NextAuth)     │     │   (JWT Strategy)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│   SuperAdmin    │────▶│   API Service    │──────────────┘
│   (Cookie)      │     │   (Centralized)  │
└─────────────────┘     └──────────────────┘
```

### 4.2 การทำงานของ SuperAdmin Auth

1. User กรอก email/password ที่ `/login`
2. `loginWithSuperAdmin()` (Server Action) ยิง POST ไปยัง `API_SERVICE_URL/api/auth/superadmin`
3. API Service ตรวจสอบกับ Vercel Environment Variables (`USER_SUPERADMIN`, `PASS_SUPERADMIN`)
4. ถ้าผ่าน → สร้าง `sf_superadmin_session` cookie (HttpOnly, Secure)
5. `middleware.ts` เช็ค cookie นี้ + NextAuth session

### 4.3 การใช้งานใน Code

```typescript
// ตรวจสอบ session ธรรมดา (Google Auth)
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);
if (!session?.user?.id) throw new Error("Unauthorized");

// ตรวจสอบ role
if (session.user.role === "superadmin") { ... }
```

---

## 5. Database & Schema Standards

### 5.1 Table Naming Convention

| Table | ชื่อ | หมายเหตุ |
|-------|------|----------|
| `users` | ข้อมูลผู้ใช้ (NextAuth adapter) | ชื่อตารางเป็น `users` (พหูพจน์) |
| `accounts` | OAuth accounts | NextAuth adapter |
| `sessions` | JWT sessions | NextAuth adapter |
| `verification_tokens` | Email verification | NextAuth adapter |
| `transactions` | ธุรกรรมซื้อ/ขาย/โอน | Level 2: มี `portfolio_id` |
| `portfolios` | Portfolio entities | **NEW (Level 2)** แทน localStorage |
| `market_prices` | ราคาเหรียญย้อนหลัง | - |
| `daily_snapshots` | Snapshot พอร์ตรายวัน | jsonb เก็บ holdings |

**⚠️ สำคัญ:** ชื่อตารางใช้ **snake_case** และ **พหูพจน์** เสมอ (users, accounts, portfolios)

### 5.2 Migration Standards (Mandatory)

```
┌────────────────────────────────────────────────────────────────┐
│                   DATABASE MIGRATION RULES                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. NEVER modify existing migration files                     │
│     └─> สร้างไฟล์ migration ใหม่เท่านั้น                        │
│                                                                 │
│  2. Migration ต้อง idempotent (รันได้หลายครั้งไม่พัง)           │
│     └─> ใช้ CREATE TABLE IF NOT EXISTS                          │
│     └─> ใช้ ALTER TABLE ... ADD COLUMN IF NOT EXISTS           │
│                                                                 │
│  3. ต้อง handle ทุก schema version ที่อาจมีใน production        │
│     └─> ตรวจสอบ column/table ว่ามีอยู่หรือไม่ก่อน migrate       │
│                                                                 │
│  4. ต้อง migrate ข้อมูลเก่าไป schema ใหม่โดยอัตโนมัติ         │
│     └─> ใช้ PL/pgSQL DO block สำหรับ logic ซับซ้อน              │
│                                                                 │
│  5. ชื่อไฟล์: YYYY_MM_DD_NN_descriptive_name.sql                │
│     └─> หรือใช้ลำดับหมายเลข: 0001_, 0002_, 0003_               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 Level 2 Portfolio Architecture (Standardized Schema)

**มาตรฐานฐานข้อมูล Level 2 (ใช้ทุก environment):**

**เมื่อวันที่:** 2026-04-05  
**ผู้พัฒนา:** Cascade  
**ไฟล์ที่แก้ไข:** `app/db/schema.ts`, `app/api/portfolios/route.ts`, `app/dashboard/components/CyberpunkDashboard.tsx`

#### ความเปลี่ยนแปลงหลัก:
- **Before:** `portfolios` เก็บแค่ชื่อแทน `broker` (Level 1)
- **After:** `portfolios` เป็น entity จริง มี transactions linked ผ่าน `portfolio_id`

#### Database Schema (Level 2):

```typescript
// Schema Definition - app/db/schema.ts
// ⚠️ ต้องตรงกับ migration 0003_standardize_portfolio_schema.sql

// portfolios - Portfolio Entity
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                    // "My BTC Holdings"
  description: text("description"),                // Optional
  exchangeType: text("exchange_type").default("CUSTOM"), // BINANCE_TH, BITKUB, OKX, CUSTOM
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unq: unique().on(table.userId, table.name),
}));

// transactions - Updated with portfolio_id
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  portfolioId: integer("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" }),
  broker: text("broker").notNull().default("BINANCE_TH"), // [LEGACY] backward compatibility
  asset: text("asset").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }), // Average Buy Price (THB)
  type: text("type").notNull(), // 'DEPOSIT' or 'WITHDRAW'
  note: text("note"), // Exchange Rate (THB/USD) stored here
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**มาตรฐาน SQL (ใช้ใน migrations):**
```sql
-- ต้องสร้าง portfolios table ด้วยโครงสร้างนี้เท่านั้น
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exchange_type TEXT DEFAULT 'CUSTOM',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
);

-- สำหรับ transactions
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS portfolio_id INTEGER 
  REFERENCES portfolios(id) ON DELETE CASCADE;
```

#### API Endpoints (Level 2):
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolios` | ดึง portfolios ทั้งหมดของ user พร้อม transaction count |
| POST | `/api/portfolios` | สร้าง portfolio ใหม่ (body: { name, description, exchangeType }) |
| PUT | `/api/portfolios/:id` | อัปเดต portfolio ตาม id |
| DELETE | `/api/portfolios/:id` | ลบ portfolio (cascade ไป transactions) |

#### Migration Steps:
1. รัน SQL: `app/db/migrations/0002_level2_portfolio_architecture.sql`
2. สร้าง default portfolios จาก existing transactions ด้วย function `create_default_portfolios_for_user()`
3. อัปเดต transactions ให้มี `portfolio_id`

**⚠️ CRITICAL: Schema Standardization (0003)**

เนื่องจาก migration 0001 และ 0002 มีความขัดแย้งกัน (0001 สร้าง `portfolios` ด้วย `broker_id`, 0002 สร้างใหม่แต่ใช้ `IF NOT EXISTS` ทำให้ schema เก่าค้างอยู่) จึงต้องรัน:

```bash
# สำหรับทุก environment (dev/staging/prod)
psql $DATABASE_URL -f app/db/migrations/0003_standardize_portfolio_schema.sql
```

**Migration 0003 จะทำ:**
1. ตรวจสอบ schema ปัจจุบัน (มี `broker_id` = old schema, มี `exchange_type` = new schema)
2. ถ้าเป็น old schema: migrate ข้อมูลไป table ใหม่
3. ถ้าไม่มี table: สร้างใหม่ตามมาตรฐาน
4. รัน `create_default_portfolios_for_user()` ให้ทุก user อัตโนมัติ

#### Data Flow (Level 2):
```
[User] → [Create Portfolio] → [portfolios table] → [portfolio_id]
                                    ↓
[Add Transaction] → [transactions table] → portfolio_id FK
                                    ↓
[Calculate Holdings] → Group by portfolio_id
```

#### Portfolio Detail Page:

**File:** `app/dashboard/portfolio/[id]/page.tsx`

**Data Source:** 
- **Asset List:** ดึงจาก `transactions` table ที่มี `portfolio_id` เท่ากับ portfolio ปัจจุบัน
- **Query Function:** `getPortfolioById(portfolioId)` ใน `app/actions/transactionActions.ts`

**Query Logic:**
```typescript
// Get transactions for this portfolio
const portfolioTransactions = await db
  .select()
  .from(transactions)
  .where(
    and(
      eq(transactions.userId, auth.userId!),
      eq(transactions.portfolioId, portfolioId)  // ← สำคัญ!
    )
  );
```

**⚠️ สำคัญ:** เมื่อบันทึก transaction ใหม่ต้องส่ง `portfolioId` เข้าไปด้วย:
```typescript
await saveTransaction({
  broker: data.broker!,
  portfolioId: portfolioDbId,  // ← ต้องมี!
  asset: data.asset!,
  amount: data.amount!.toString(),
  // ...
});
```

**สาเหตุที่แสดง "No assets found":**
1. Transactions เก่าไม่มี `portfolio_id` (schema เก่าใช้ `broker` อย่างเดียว)
2. หน้า Portfolio Detail query ด้วย `portfolioId` ทำให้ไม่เจอข้อมูล
3. **แก้ไข:** ต้องบันทึก transaction ใหม่พร้อม `portfolioId` (แก้แล้วใน `CyberpunkDashboard.tsx`)

### 5.4 Common Schema Issues & Resolutions

| ปัญหา | สาเหตุ | แก้ไข |
|-------|--------|--------|
| `broker_id` vs `exchange_type` | Migration 0001 vs 0002 conflict | รัน 0003_standardize_portfolio_schema.sql |
| `"user"(id)` vs `users(id)` | ชื่อ table ไม่ consistent | ใช้ `users` (พหูพจน์) เท่านั้น |
| `portfolio_id` เป็น NULL | Transactions เก่ายังไม่ link | รัน `create_default_portfolios_for_user()` |

**Validation Query:**
```sql
-- ตรวจสอบว่า schema ถูกต้อง
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'portfolios' 
AND column_name IN ('exchange_type', 'broker_id');
-- ต้องมี exchange_type, ไม่มี broker_id
```

### 5.5 การเพิ่ม/แก้ไข Schema

1. แก้ไข `app/db/schema.ts`
2. รัน `npx drizzle-kit push` เพื่อ apply changes
3. อัปเดต Server Actions ที่เกี่ยวข้อง

### 5.6 การ Query

```typescript
import { db } from "../db";
import { transactions } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// SELECT with WHERE
const txs = await db
  .select()
  .from(transactions)
  .where(eq(transactions.userId, userId))
  .orderBy(desc(transactions.date));

// INSERT
await db.insert(transactions).values({ ... });

// UPDATE
await db.update(transactions)
  .set({ ... })
  .where(eq(transactions.id, id));

// DELETE
await db.delete(transactions).where(eq(transactions.id, id));
```

---

## 6. Server Actions Pattern

### 6.1 โครงสร้างไฟล์

ทุกไฟล์ใน `app/actions/` ต้องมี:

```typescript
"use server";

import { db } from "../db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// ทุก function ต้องเช็ค auth ก่อน
export async function someAction(data: SomeType) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  // ... logic
  
  revalidatePath("/dashboard"); // ถ้ามีการเปลี่ยนแปลงข้อมูล
  return { success: true, data: result };
}
```

### 6.2 Error Handling

```typescript
export async function riskyAction() {
  try {
    // ... operation
  } catch (error) {
    console.error("Action Error:", error);
    return { success: false, error: "Human readable message" };
  }
}
```

### 6.3 Revalidation

หลังจากเปลี่ยนแปลงข้อมูลที่มีผลต่อ UI:

```typescript
import { revalidatePath } from "next/cache";

await db.insert(transactions).values({ ... });
revalidatePath("/dashboard");
revalidatePath("/daily");
```

---

## 7. API Routes

### 7.1 Public APIs (ไม่ต้อง auth)

- `GET /api/ticker` - ราคาเหรียญรวม (ใช้แสดงผล market data)

### 7.2 Protected APIs

- ใช้ `getServerSession` เช็คสิทธิ์เหมือน Server Actions

### 7.3 Cron Routes (Vercel Cron)

- `GET /api/cron/btc` - บันทึกราคา BTC อัตโนมัติ
- `GET /api/cron/snapshot` - บันทึก snapshot พอร์ตผู้ใช้ทุกคน
- `GET /api/cron/price-history` - บันทึกราคาเหรียญทุกวันตอน 6:00 AM สำหรับประวัติราคา

Cron config อยู่ใน `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/btc", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/snapshot", "schedule": "0 0 * * *" },
    { "path": "/api/cron/price-history", "schedule": "0 6 * * *" }
  ]
}
```

**Price History Tracking (6:00 AM Daily)**
- บันทึกราคาเหรียญทุกเหรียญใน `SUPPORTED_ASSETS` ลงฐานข้อมูล
- ใช้สำหรับวิเคราะห์แนวโน้มราคาย้อนหลัง
- ข้อมูลเก็บในตาราง `price_history` (ถ้ามี) หรือ `market_snapshots`

---

## 8. การทำงานกับ External APIs

### 8.1 แหล่งข้อมูลที่ใช้

| แหล่งข้อมูล | ใช้สำหรับ |
|-------------|-----------|
| CoinGecko | ราคาเหรียญ (fallback) |
| open.er-api.com | อัตราแลกเปลี่ยน USD/THB |
| api-service | SuperAdmin auth |

### 8.2 Pattern การ Fetch

```typescript
// ใน Client Component - ใช้ useEffect
useEffect(() => {
  const fetchData = async () => {
    const res = await fetch("/api/ticker");
    const data = await res.json();
    setMarketData(data);
  };
  fetchData();
  const interval = setInterval(fetchData, 15000); // 15 วินาที
  return () => clearInterval(interval);
}, []);
```

### 8.3 การ Caching

- Server-side: ใช้ `cache: "no-store"` สำหรับ auth
- Client-side: polling ทุก 15 วินาทีสำหรับราคา

---

## 9. UI/UX Standards

### 9.1 Design System

- **Color Palette:**
  - Background: `#121214` (dark mode) / `#27272a` (landing)
  - Primary: `#0891b2` (cyan)
  - Accent: `#22d3ee` (light cyan)
  - Text: white / zinc-500 / zinc-400

- **Typography:**
  - Font: Geist (sans), Geist Mono
  - Tracking: tight (`tracking-tighter`, `tracking-tight`)
  - Style: Uppercase สำหรับ labels, Italic สำหรับ headings

- **Components:**
  - Border radius: `rounded-3xl` (40px), `rounded-[40px]`
  - Shadows: `shadow-2xl`, `shadow-xl`
  - Borders: `border-white/5`, `border-white/10`

### 9.2 Responsive Breakpoints

- Mobile: default
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)
- Wide: `xl:` (1280px+)

### 9.3 Icons & Assets

- โลโก้เหรียญอยู่ใน `public/coins/`
- รองรับหลาย format: `.svg` (preferred), `.png`, `.webp`
- ใช้ component `IconWithFallback` สำหรับ handle missing images

---

### 9.4 Supported Assets (SUPPORTED_ASSETS Standard)

**Single Source of Truth:** `app/dashboard/lib/constants.ts`

**⚠️ กฎเหล็ก:** ห้ามกำหนด `SUPPORTED_ASSETS` ซ้ำซ้อนในหลายไฟล์

**วิธีใช้งาน:**
```typescript
// ✅ ถูกต้อง - import จาก constants.ts
import { SUPPORTED_ASSETS } from "../lib/constants";
// หรือ
import { SUPPORTED_ASSETS } from "./lib/constants";

// ใช้งาน
const assetsList = SUPPORTED_ASSETS;
```

**รายการเหรียญมาตรฐาน (19 เหรียญ):**
```typescript
export const SUPPORTED_ASSETS = [
  "THB", "USDT", "USDC", "BTC", "ETH", "BNB", "SOL", "AVAX",
  "ADA", "DOT", "DOGE", "XRP", "NEAR", "ORDI", "MOODENG", "GOAT",
  "AVEX", "SATS", "TRX"
];
```

**❌ ห้ามทำ:**
- ห้ามกำหนด `SUPPORTED_ASSETS` ใหม่ใน component ใดๆ
- ห้าม export `SUPPORTED_ASSETS` จากหลายไฟล์
- ห้ามแก้ไขรายการเหรียญโดยไม่ผ่าน `constants.ts`

**ไฟล์ที่ใช้ SUPPORTED_ASSETS:**
- `AssetModal.tsx` - import จาก `../lib/constants`
- `CyberpunkDashboard.tsx` - import จาก `../lib/constants`
- `DashboardContent.tsx` - import จาก `../lib/constants`
- `page.tsx` - import จาก `./lib/constants` แล้ว re-export
- `daily/page.tsx` - import จาก `../dashboard/page`

---

## 10. Environment Variables

### 10.1 Required (Production)

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="random-secret-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# API Service (Centralized Auth)
API_SERVICE_URL="https://api-service-woad.vercel.app"
```

### 10.2 Optional (Development)

```bash
# Debug
DEBUG="true"

# Local dev
NEXTAUTH_URL="http://localhost:3000"
```

---

## 11. ขั้นตอนการพัฒนา

### 11.1 เริ่มต้น Development

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า Environment Variables
# สร้างไฟล์ .env.local และใส่ค่าที่จำเป็น

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

### 11.2 การเพิ่ม Feature ใหม่

1. **ออกแบบ Schema** (ถ้าต้องใช้ DB) → `app/db/schema.ts`
2. **สร้าง Server Actions** → `app/actions/[feature]Actions.ts`
3. **สร้าง API Route** (ถ้าจำเป็นสำหรับ client polling) → `app/api/[feature]/route.ts`
4. **สร้าง Page/Component** → `app/[feature]/page.tsx`
5. **เชื่อมต่อ** ผ่าน Server Actions
6. **Revalidate paths** ที่เกี่ยวข้อง

### 11.3 การ Deploy

- Deploy บน Vercel โดยอัตโนมัติผ่าน Git integration
- Database: Neon (Serverless PostgreSQL)
- ตรวจสอบ Environment Variables บน Vercel Dashboard

---

## 14. File Organization Standards (New)

### 14.1 หลักการจัดระเบียบไฟล์

**เป้าหมาย:** โครงสร้างไฟล์ที่เป็นระบบ หาไฟล์เจอง่าย ไม่ซ้ำซ้อน

```
app/
├── actions/           # Server Actions เท่านั้น
├── api/               # API Routes
├── components/        # Shared components
│   ├── providers/     # Auth guards, context providers
│   └── ui/            # Reusable UI components
├── dashboard/         # Dashboard feature
│   ├── components/    # Dashboard-specific
│   ├── lib/           # Dashboard utils
│   └── portfolio/     # Portfolio pages
├── db/                # Database config
├── lib/               # Shared utilities
│   └── utils/         # Helper functions
│       └── hooks/     # Custom hooks
├── login/             # Login page
├── market/            # Market feature
└── tools/             # [NEW] Utility/testing pages
```

### 14.2 กฎการย้ายไฟล์

| ประเภท | ตำแหน่ง | ตัวอย่าง |
|--------|---------|----------|
| **Pages หลัก** | `app/[feature]/` | `app/login/`, `app/dashboard/` |
| **Testing tools** | `app/tools/[name]/` | `app/tools/api-test/` |
| **Shared components** | `app/components/` | `app/components/providers/` |
| **Hooks** | `app/lib/utils/hooks/` | `app/lib/utils/hooks/use-toast.ts` |
| **Auth guards** | `app/components/providers/` | `app/components/providers/auth-guard.tsx` |

### 14.3 ไฟล์ที่ต้องลบ/ย้าย (Cleanup)

| ไฟล์/โฟลเดอร์ | การกระทำ | เหตุผล |
|--------------|----------|--------|
| `app/daily/` | ❌ ลบ | ไม่ใช้แล้ว |
| `middleware.ts` | ❌ ลบ | ใช้ auth-proxy แทน |
| `app/lib/login/page.tsx` | 🔄 ย้าย → `app/login/page.tsx` | ไม่ควรซ้อน lib |
| `app/lib/auth-guard.tsx` | 🔄 ย้าย → `app/components/providers/` | เป็นส่วนของ UI |
| `app/hooks/use-toast.ts` | 🔄 ย้าย → `app/lib/utils/hooks/` | จัดระเบียบ hooks |
| `app/api-test/page.tsx` | 🔄 ย้าย → `app/tools/api-test/page.tsx` | เป็น testing tool |
| `app/binance-terminal/page.tsx` | 🔄 ย้าย → `app/tools/binance-terminal/page.tsx` | เป็น testing tool |
| `app/market/page.tsx` | 🔄 ย้าย → `app/tools/market-data/page.tsx` | เป็น testing tool |

### 14.4 Component Size Standards

**หลักการ:** ไฟล์ .tsx ควรมีขนาดไม่เกิน 500 บรรทัด

| ขนาด | การกระทำ |
|------|----------|
| < 300 บรรทัด | ✅ OK - Single component |
| 300-500 บรรทัด | ⚠️ Monitor - Consider splitting |
| > 500 บรรทัด | 🔴 Refactor - Must split |

**ตัวอย่างการแยก:** `CyberpunkDashboard.tsx` (59KB) →
- `PortfolioCard.tsx`
- `AssetRow.tsx`
- `AssetDetailView.tsx`
- `PortfolioModal.tsx`

---

## 🚨 Checklist สำหรับ AI Agents

ก่อนส่ง Pull Request หรือ commit การเปลี่ยนแปลง:

- [ ] ใช้ Server Actions สำหรับ DB operations
- [ ] มี auth check ในทุก Server Action
- [ ] ไม่มี secrets ใน code (ใช้ env vars)
- [ ] TypeScript types ครบถ้วน
- [ ] ไม่มี `console.log` ที่ไม่จำเป็น
- [ ] Revalidate paths หลังเปลี่ยนแปลงข้อมูล
- [ ] ทดสอบใน dev mode ก่อน

---

## 📞 การติดต่อสื่อสาร

หากมีคำถามหรือข้อสงสัยเกี่ยวกับกติกา:

1. อ่าน `ARCHITECTURE.md` สำหรับรายละเอียดเฉพาะทาง
2. ดูตัวอย่างจาก code ที่มีอยู่แล้ว
3. เขียนคำถามใน comment ของ PR

---

## 🔄 Changelog

| เวอร์ชัน | วันที่ | รายละเอียด |
|---------|-------|-----------|
| 1.2.0 | 2026-04-06 | **File Organization Standards** - Section 14, ย้ายไฟล์ไปตำแหน่งที่ถูกต้อง, ลบ daily/, แก้ไขเลขหัวข้อซ้ำ |
| 1.1.0 | 2026-04-05 | **Level 2 Portfolio Architecture** - Portfolio เป็น entity จริง, เพิ่ม `portfolio_id` ใน transactions, แก้ไข API endpoints |
| 1.0.0 | 2026-04-04 | สร้างกติกากลางครั้งแรก |

---

**หมายเหตุ:** เอกสารนี้จะถูกอัปเดตเมื่อมีการเปลี่ยนแปลง architecture หรือ patterns สำคัญ

---

## 🚨 MANDATORY RULES FOR ALL AI AGENTS

> **ข้อบังคับนี้มีผลทันทีสำหรับ AI Agents ทุกตัวที่ทำงานในโปรเจกต์นี้**
> 
> **Audit Date:** 2026-04-04  
> **Auditor:** Cascade  
> **Status:** ACTIVE

### ⚠️ CRITICAL ISSUES FOUND (ต้องแก้ไขทันที)

| Issue | Location | Severity | Action Required |
|-------|----------|----------|-----------------|
| **middleware.ts ยังอยู่** | `/middleware.ts` | 🔴 HIGH | ลบไฟล์นี้ทันที - เปลี่ยนใช้ auth-proxy แทน |
| **any types ใน auth** | `app/api/auth/[...nextauth]/route.ts:23,30` | 🟡 MEDIUM | แก้ไข type definitions |
| **Duplicate DB connections** | หลายไฟล์สร้าง connection เอง | 🟡 MEDIUM | ใช้ `app/db/index.ts` เป็นหลัก |

### 📁 PROJECT STRUCTURE AUDIT

#### ✅ Validated Files (ผ่านการตรวจสอบ)

| Path | Status | Notes |
|------|--------|-------|
| `app/db/schema.ts` | ✅ Updated | Level 2 Portfolio Architecture แล้ว |
| `app/api/portfolios/route.ts` | ✅ Updated | REST API แบบ Level 2 |
| `app/db/migrations/0002_level2_portfolio_architecture.sql` | ✅ New | Migration สำหรับ Level 2 |
| `app/db/index.ts` | ✅ OK | Single connection point |
| `app/lib/auth-proxy.ts` | ✅ OK | สร้างใหม่ ใช้แทน middleware |
| `app/lib/auth-guard.tsx` | ✅ OK | Client auth สร้างใหม่ |
| `app/actions/transactionActions.ts` | ✅ OK | ใช้ auth-proxy แล้ว |
| `app/actions/authActions.ts` | ✅ OK | SuperAdmin login |
| `app/api/auth/[...nextauth]/route.ts` | ⚠️ NEEDS FIX | มี any types |
| `app/api/cron/btc/route.ts` | ✅ OK | Cron job วันที่ 1 |
| `app/api/cron/snapshot/route.ts` | ✅ OK | Daily snapshot |
| `app/api/ticker/route.ts` | ✅ OK | Public API |
| `app/layout.tsx` | ✅ OK | Root layout |
| `app/providers.tsx` | ✅ OK | Session provider |
| `package.json` | ✅ OK | Dependencies อัปเดต |
| `tsconfig.json` | ✅ OK | Paths ตั้งถูกต้อง |
| `drizzle.config.ts` | ✅ OK | Config ถูกต้อง |
| `vercel.json` | ✅ OK | Cron 23:00 |

#### 🔴 Files to REMOVE

| File | Reason |
|------|--------|
| `middleware.ts` | เปลี่ยนใช้ auth-proxy pattern |
| `app/daily/` | ไม่ใช้แล้ว |

#### 🔄 Files to MOVE (File Organization 2026-04-06)

| ก่อน | หลัง | สถานะ |
|------|------|--------|
| `app/lib/login/page.tsx` | `app/login/page.tsx` | 🔄 ย้าย |
| `app/lib/auth-guard.tsx` | `app/components/providers/auth-guard.tsx` | 🔄 ย้าย |
| `app/hooks/use-toast.ts` | `app/lib/utils/hooks/use-toast.ts` | 🔄 ย้าย |
| `app/api-test/page.tsx` | `app/tools/api-test/page.tsx` | 🔄 ย้าย |
| `app/binance-terminal/page.tsx` | `app/tools/binance-terminal/page.tsx` | 🔄 ย้าย |
| `app/market/page.tsx` | `app/tools/market-data/page.tsx` | 🔄 ย้าย |

### 🔐 AUTHENTICATION ARCHITECTURE (NEW)

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. GOOGLE OAUTH (Users)                                    │
│     └─> NextAuth.js ──> JWT Session                         │
│         └─> app/api/auth/[...nextauth]/route.ts             │
│                                                             │
│  2. SUPERADMIN (API Service)                                  │
│     └─> loginWithSuperAdmin() ──> Cookie                    │
│         └─> app/actions/authActions.ts                      │
│                                                             │
│  3. PROTECTED ROUTES (No Middleware)                        │
│     ├─> Server: requireAuth() from app/lib/auth-proxy.ts    │
│     ├─> Client: useRequireAuth() from app/lib/auth-guard.tsx│
│     └─> API: Manual getServerSession() check                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🛡️ MANDATORY PATTERNS (ห้ามทำอย่างอื่น)

#### Pattern 1: Server Actions Auth
```typescript
// ✅ CORRECT - ใช้ auth-proxy
import { requireAuth } from "../lib/auth-proxy";

export async function myAction() {
  const auth = await requireAuth();
  // auth.userId!, auth.role, auth.isSuperAdmin
}

// ❌ WRONG - ไม่ใช้ middleware แล้ว
// ไม่ต้องตรวจสอบเองด้วย getServerSession
```

#### Pattern 2: Client Components Auth
```typescript
// ✅ CORRECT - ใช้ auth-guard
import { useRequireAuth, AuthGuard } from "../lib/auth-guard";

// Hook
const { isAuthenticated, isLoading } = useRequireAuth();

// Component
<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

#### Pattern 3: Database Queries
```typescript
// ✅ CORRECT - ใช้ shared connection
import { db } from "../db";

// ❌ WRONG - อย่าสร้าง connection ใหม่
const sql = neon(process.env.DATABASE_URL!); // ห้ามทำใน actions
const db = drizzle(sql);
```

### 📋 CHECKLIST ก่อนแก้ไขไฟล์

ก่อนแก้ไขไฟล์ใดๆ AI Agent ต้องตอบคำถามนี้:

1. [ ] ไฟล์นี้ import จาก `app/db/index.ts` หรือไม่?
2. [ ] ถ้าเป็น Server Action ใช้ `requireAuth()` หรือไม่?
3. [ ] ถ้าเป็น Client Page ใช้ `AuthGuard` หรือ `useRequireAuth` หรือไม่?
4. [ ] มี `any` type หรือไม่? (ต้องแก้)
5. [ ] Error handling ครบหรือไม่?

### 🚫 FORBIDDEN ACTIONS (ห้ามทำเด็ดขาด)

| Action | Reason |
|--------|--------|
| สร้าง `middleware.ts` ใหม่ | ใช้ auth-proxy แทน |
| ใช้ `getServerSession` ตรงๆ ใน Actions | ใช้ `requireAuth()` แทน |
| สร้าง DB connection ใหม่ | ใช้ `app/db/index.ts` |
| Hardcode secrets | ใช้ `process.env` |
| ใช้ `any` type | กำหนด type ชัดเจน |
| `console.log` ที่ไม่จำเป็น | ลบออก |

### 🔧 IMMEDIATE ACTIONS REQUIRED

1. **ลบ `middleware.ts`** ทันที (ถ้ายังมี)
2. **แก้ any types** ใน `app/api/auth/[...nextauth]/route.ts`
3. **ตรวจสอบ** ว่าทุก Server Action ใช้ `requireAuth()`
4. **ตรวจสอบ** ว่า pages ที่ต้องการ auth ใช้ `AuthGuard`

---

## 📡 API Test & Comparison Module (NEW)

> **เพิ่มเมื่อ:** 2026-04-04  
> **ผู้พัฒนา:** Cascade  
> **ไฟล์หลัก:** `app/api-test/page.tsx`, `app/api/proxy/route.ts`

### Overview
ระบบทดสอบและเปรียบเทียบ API สำหรับข้อมูลราคา Cryptocurrency, อัตราแลกเปลี่ยน และ Technical Analysis

### Architecture - Proxy Pattern (CORS Bypass)
```
Browser → Next.js App → /api/proxy → External API
                         ↓
                    Retry Logic (2 retries, exponential backoff)
                         ↓
                    Error Classification
```

### Supported APIs (8 Providers)

| Provider | Type | Auth | Rate Limit | Features | Reliability |
|----------|------|------|------------|----------|-------------|
| **Binance TH** | Crypto Exchange | None | 1200/min | THB pairs, real-time | ✅ Stable |
| **Bitkub** | Crypto Exchange | None | Unknown | THB pairs, Thai | ✅ Stable |
| **CoinMarketCap** | Market Data | API Key | 10K/month | USD, rankings | ⚠️ API Key |
| **CoinGecko** | Market Data | None | 10K/month | USD, generous | ✅ Stable |
| **FreeCryptoAPI** | Market + TA | Token | 100K/month | Technical analysis, news | ✅ Generous |
| **API Ninjas** | Price | API Key | Unknown | Pair pricing | ⚠️ API Key |
| **BOT Exchange Rate** | Forex (THB) | API Key | 200/hr | Official Bank of Thailand | ✅ Official |
| **OKX** | Exchange | None | 20/sec | USDT pairs | ⚠️ DNS Block (Thailand) |

### API Keys (in `/api/proxy/route.ts`)
```typescript
const API_KEYS = {
  coinmarketcap: "8a9724300476473f90e7c46d7f9f1f43",
  ninjas: "6wj8XEnatQQqO9mtygIwbPnVUurU6BW1oxBBsDGY",
  freecrypto: "smdmv7ig8ht6jh0xrei4",
  bot: "eyJvcmciOiI2NzM1NzgwZWM4YzFlYjAwMDEyYTM3NzEiLCJpZCI6IjFjNGVkNjBlYWU5NzRhMzY4MzM0YzRlM2IzYjk0MGNkIiwiaCI6Im11cm11cjEyOCJ9",
};
```

### Reliability Tracking

#### Metrics
- **Success Rate**: เปอร์เซ็นต์การเรียก API สำเร็จ
- **Total/Failed Calls**: จำนวนการเรียกทั้งหมดและที่ล้มเหลว
- **Avg Response Time**: เวลาตอบสนองเฉลี่ย
- **Last Error Type**: ประเภท error ล่าสุด

#### Stability Status
| Status | Success Rate | สี | คำอธิบาย |
|--------|--------------|-----|---------|
| **Stable** | ≥90% | 🟢 เขียว | API ใช้งานได้ดี |
| **Flaky** | 50-89% | 🟡 เหลือง | ไม่เสถียร อาจมีปัญหา |
| **Down** | <50% | 🔴 แดง | ใช้งานไม่ได้ส่วนใหญ่ |

#### Error Classification
| Type | Indicators | สาเหตุทั่วไป |
|------|-----------|-------------|
| **NETWORK** | ENOTFOUND, DNS, getaddrinfo | DNS block, ISP block, server offline |
| **CORS** | CORS policy, cross-origin | ไม่มี headers ที่ถูกต้อง, browser security |
| **RATE_LIMIT** | 429, rate limit | ยิง request มากเกิน, quota หมด |
| **TIMEOUT** | timeout, ETIMEDOUT | เน็ตช้า, server โอเวอร์โหลด |
| **UNKNOWN** | อื่นๆ | Error ที่ไม่คาดคิด |

### Retry Logic
```typescript
// Exponential backoff: 1s → 2s → 4s
async function fetchWithRetry(url, headers, retries = 2, delay = 1000)
```

### Usage Rules

#### 1. ต้องใช้ Proxy เสมอ
```typescript
// ✅ ถูกต้อง
const res = await fetch("/api/proxy?provider=binanceth");

// ❌ ผิด - จะโดน CORS block
const res = await fetch("https://api.binance.th/...");
```

#### 2. Handle Errors อย่างเหมาะสม
```typescript
try {
  const json = await (await fetch("/api/proxy?provider=okx")).json();
  if (!json.success) throw new Error(json.error);
} catch (error) {
  const errorType = getErrorType(error.message);
  // Fallback ไป API สำรอง
}
```

#### 3. API Priority (Fallback Chain)
**สำหรับราคา THB:**
```
Binance TH → Bitkub → (CoinGecko × BOT Rate)
```

**สำหรับราคา USD:**
```
CoinGecko → CoinMarketCap → FreeCryptoAPI
```

**สำหรับ Technical Analysis:**
```
FreeCryptoAPI (มี RSI, MACD, Bollinger Bands)
```

### Database Schema (Future)

#### api_monitoring table
```sql
CREATE TABLE api_monitoring (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_type VARCHAR(20),
  error_message TEXT
);
```

### UI Features (ที่ `/api-test`)
- ✅ Real-time performance metrics
- ✅ Reliability percentage (เช่น OKX 3/10 = 30%)
- ✅ Status indicators (Stable/Flaky/Down)
- ✅ Error type logging (NETWORK, CORS, RATE_LIMIT)
- ✅ Auto-refresh ทุก 30 วินาที
- ✅ Raw response preview

### Last Updated
2026-04-04 - Added 8 providers with full reliability tracking system

---

## 12. Price Fetching Standards (2026-04-06)

### 12.1 Overview
การคำนวณ P&L และมูลค่าพอร์ต ต้องใช้ราคาตลาดปัจจุบันที่เหมาะสมกับประเภทของ Exchange/Wallet

**⚠️ กฎเหล็ก:** ห้ามกำหนด `getPriceKey` หรือ `PRICE_SOURCE_MAP` ซ้ำในหลายไฟล์ ให้ import จาก `priceUtils.ts` เท่านั้น

### 12.2 Price Source Mapping (Centralized)

**ไฟล์มาตรฐาน:** `app/dashboard/lib/priceUtils.ts`

| exchange_type | Price Source | API Endpoint | เหตุผล |
|---------------|--------------|--------------|--------|
| **BINANCE_TH** | **Bitkub** | `/api/ticker` → `bitkub` | Binance TH API มัก return empty |
| **BITKUB** | Bitkub | `/api/ticker` → `bitkub` | Primary source |
| **OKX** | OKX | `/api/ticker` → `okx` | Primary source |
| **METAMASK** | **CoinGecko** | `/api/ticker` → `coingecko` | Global average price |
| **LEDGER** | **CoinGecko** | `/api/ticker` → `coingecko` | Global average price |
| **CUSTOM** | **CoinGecko** | `/api/ticker` → `coingecko` | Global average price |

### 12.3 Implementation (ใช้ priceUtils.ts)

```typescript
// ✅ ถูกต้อง - import จาก priceUtils.ts
import { 
  getPriceKey, 
  getAssetPrice, 
  calculatePnL, 
  calculateValue,
  PRICE_SOURCE_MAP 
} from "../lib/priceUtils";

// Usage - ดึงราคา
const marketPrice = getAssetPrice(prices, item.broker, item.asset);

// Usage - คำนวณ P&L
const pnl = calculatePnL(marketPrice, item.avgPrice);

// Usage - คำนวณ Value
const currentValue = calculateValue(item.amount, marketPrice);
```

### 12.4 ❌ ห้ามทำ

```typescript
// ห้ามกำหนดเองใน component
const PRICE_SOURCE_MAP = { ... }; // ❌ ห้าม!

const getPriceKey = (broker: string) => { ... }; // ❌ ห้าม!

// ห้ามใช้โดยตรงแบบนี้
const price = prices[broker]?.[asset]; // ❌ ไม่เป็นมาตรฐาน
```

### 12.5 P&L Calculation Formula

```typescript
// P&L (%) = ((ราคาตลาด - ราคาซื้อ) / ราคาซื้อ) × 100
const pnl = calculatePnL(marketPrice, avgPrice); // ใช้จาก priceUtils.ts

// Value = จำนวน × ราคาตลาด
const currentValue = calculateValue(amount, marketPrice);
```

### 12.6 Files Using Price Utils

- `CyberpunkDashboard.tsx` → import from `../lib/priceUtils`
- `portfolio/[id]/page.tsx` → import from `../../lib/priceUtils`
- ไฟล์อื่นๆ ที่ต้องใช้ราคา → import จาก `priceUtils.ts`

### 12.7 Display Standards

| Column | ค่าที่แสดง | คำนวณจาก |
|--------|-----------|----------|
| **Price** | Average Buy Price | `tx.price` จาก database |
| **M: ฿XXX** | Market Price (small) | `getAssetPrice(prices, broker, asset)` |
| **P&L** | กำไร/ขาดทุน % | `calculatePnL(market, buy)` |
| **Value** | มูลค่าปัจจุบัน | `calculateValue(amount, market)` |

### 12.8 Currency Toggle (THB/USD)

**Feature:** ผู้ใช้สามารถเลือกสกุลเงินสำหรับกรอกราคาซื้อได้

#### Behavior

| Currency | Average Buy Price | Exchange Rate Field | การคำนวณ |
|----------|-------------------|---------------------|----------|
| **THB** | กรอกเป็นบาท | ซ่อน | บันทึกตรงๆ |
| **USD** | กรอกเป็นเหรียญ | แสดง (Required) | แปลงเป็น THB = USD × Rate |

#### Implementation

```typescript
// State
const [currency, setCurrency] = useState<"THB" | "USD">("THB");

// Currency Toggle UI
<div className="flex gap-2">
  <button onClick={() => setCurrency("THB")} className={...}>THB</button>
  <button onClick={() => setCurrency("USD")} className={...}>USD</button>
</div>

// Save Logic
avgPrice: currency === "USD" && avgPrice && exchangeRate
  ? parseFloat(avgPrice) * parseFloat(exchangeRate)  // Convert to THB
  : parseFloat(avgPrice),                            // Already THB

exchangeRate: currency === "USD" ? parseFloat(exchangeRate) : undefined
```

#### Database Storage
- `price` (transactions table): เก็บเป็น THB เสมอ
- `note`: เก็บ Exchange Rate เมื่อซื้อด้วย USD

### 12.6 Future Improvements

1. **CoinMarketCap Integration** สำหรับ Wallet/CUSTOM types
   ```typescript
   "CUSTOM": "coinmarketcap",  // Global average price
   "METAMASK": "coinmarketcap",
   ```

2. **Multi-source Price Aggregation**
   ```typescript
   // เฉลี่ยราคาจากหลายแหล่ง
   const avgPrice = (binancePrice + bitkubPrice) / 2;
   ```

3. **Price Quality Score**
   - ระบุว่าราคามาจากแหล่งไหน
   - แสดง timestamp ของราคา
   - Warning ถ้าราคาเก่า > 5 นาที

---

## 13. UI Components & Constants Standards (2026-04-06)

### 13.1 Overview
การใช้ UI Components และ Constants ต้อง import จาก centralized sources เท่านั้น เพื่อความ consistent ทั่วแอพ

**⚠️ กฎเหล็ก:** ห้ามกำหนด `EXCHANGES_MAPPED`, `NEON_COLORS`, `GlassCard`, `NeonButton` ซ้ำในหลายไฟล์

### 13.2 Constants (app/dashboard/lib/constants.ts)

**Export ที่ใช้:**
- `SUPPORTED_ASSETS` - รายการเหรียญที่รองรับ
- `EXCHANGES_MAPPED` - รายการ Exchange/Wallet พร้อม icon และ color
- `NEON_COLORS` - สี neon สำหรับ UI
- `MarketData` - Interface ข้อมูลราคา
- `PortfolioItem` - Interface ข้อมูลพอร์ต

```typescript
// ✅ ถูกต้อง - import จาก constants.ts
import { SUPPORTED_ASSETS, EXCHANGES_MAPPED, NEON_COLORS } from "../lib/constants";
```

### 13.3 UI Components (app/dashboard/components/ui/)

**Components ที่ centralized:**
- `GlassCard` - Card แบบ glass morphism
- `NeonButton` - Button แบบ neon style

```typescript
// ✅ ถูกต้อง - import จาก components/ui/
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
```

### 13.4 ❌ ห้ามทำ

```typescript
// ห้ามกำหนดซ้ำใน component
const EXCHANGES_MAPPED = [...]; // ❌ ห้าม!
const NEON_COLORS = [...];      // ❌ ห้าม!
function GlassCard(...) { ... } // ❌ ห้าม!
function NeonButton(...) { ... } // ❌ ห้าม!
```

### 13.5 Files Using Centralized Components

- `CyberpunkDashboard.tsx` → import from `../lib/constants`, `../components/ui/`
- `portfolio/[id]/page.tsx` → import from `../../lib/constants`, `../../components/ui/`
- `DashboardContent.tsx` → import from `../lib/constants`

---

*เอกสารนี้เป็นมาตรฐานบังคับใช้ (Mandatory Standards) สำหรับ AI Agents ทุกตัว*
