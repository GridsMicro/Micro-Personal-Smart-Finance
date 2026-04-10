import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  serial,
  decimal,
  date,
  unique,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// --- NextAuth Tables (Standard Adapter Layout) ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").default("user"), // user, admin, superadmin
  isActive: boolean("is_active").default(true), // for admin to disable/enable users
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- Application Tables ---

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: "cascade" }),
  broker: text("broker").notNull().default("BINANCE_TH"), // [LEGACY] Keep for backward compatibility
  asset: text("asset").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }), // Optional entry price
  type: text("type").notNull(), // 'DEPOSIT' or 'WITHDRAW'
  note: text("note"),
  date: date("date").notNull(),
  // [NEW: 2026-04-08] Fee tracking fields
  fee: decimal("fee", { precision: 20, scale: 8 }), // ค่าธรรมเนียมที่จ่าย
  feeCurrency: text("fee_currency"), // สกุลเงินของค่าธรรมเนียม (e.g., THB, BTC)
  feePercent: decimal("fee_percent", { precision: 5, scale: 2 }), // เปอร์เซ็นต์ค่าธรรมเนียม (ถ้ามี)
  createdAt: timestamp("created_at").defaultNow(),
});
export const marketPrices = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  asset: text("asset").notNull().default("BTC"), // BTC, ETH, SOL, USDT
  date: date("date").notNull(),
  priceTHB: decimal("price_thb", { precision: 20, scale: 2 }).notNull(),
  priceUSD: decimal("price_usd", { precision: 20, scale: 2 }).notNull(),
  source: text("source").default("COINGECKO"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  unq: unique().on(table.date, table.asset),
}));

export const dailySnapshots = pgTable("daily_snapshots", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  totalValue: decimal("total_value", { precision: 20, scale: 2 }).notNull(),
  holdingsJson: jsonb("holdings_json").notNull().default({}), // ปริมาณเหรียญแยกแต่ละตัว
  fiatCode: text("fiat_code").notNull().default("THB"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  unq: unique().on(table.userId, table.date),
}));

// --- Portfolio Entity Table ---
// Level 2: Portfolio as real entity with transactions linked to it
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // User-defined name like "My BTC Holdings"
  description: text("description"), // Optional description
  exchangeType: text("exchange_type").default("CUSTOM"), // BINANCE_TH, BITKUB, OKX, CUSTOM
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Each user can have multiple portfolios with unique names
  unq: unique().on(table.userId, table.name),
}));

// --- Broker Fee Configuration Table ---
// เก็บค่าธรรมเนียมแต่ละโบรก (สามารถแก้ไขได้ตามประกาศของโบรก)
export const brokerFees = pgTable("broker_fees", {
  id: serial("id").primaryKey(),
  brokerId: text("broker_id").notNull().unique(), // BINANCE_TH, BITKUB, OKX, etc.
  name: text("name").notNull(), // ชื่อแสดงผล
  spotMakerFee: decimal("spot_maker_fee", { precision: 5, scale: 3 }).notNull().default("0.100"), // %
  spotTakerFee: decimal("spot_taker_fee", { precision: 5, scale: 3 }).notNull().default("0.100"), // %
  withdrawalFee: decimal("withdrawal_fee", { precision: 20, scale: 8 }).default("0"), // ค่าถอนคงที่
  withdrawalFeeCurrency: text("withdrawal_fee_currency").default("THB"),
  minWithdrawal: decimal("min_withdrawal", { precision: 20, scale: 2 }).default("0"), // ถอนขั้นต่ำ
  depositFee: decimal("deposit_fee", { precision: 20, scale: 8 }).default("0"), // ค่าฝาก (มักเป็น 0)
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Fee Summary Snapshot ---
// สรุปค่าธรรมเนียมรายวัน (สร้างโดย cron job)
export const feeDailySnapshots = pgTable("fee_daily_snapshots", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  portfolioId: integer("portfolio_id").references(() => portfolios.id),
  totalFees: decimal("total_fees", { precision: 20, scale: 2 }).notNull().default("0"), // ค่าธรรมเนียมรวม THB
  feesByBroker: jsonb("fees_by_broker").notNull().default({}), // { BINANCE_TH: 125.50, BITKUB: 80.00 }
  feesByAsset: jsonb("fees_by_asset").notNull().default({}), // { BTC: 0.001, ETH: 0.05 }
  transactionCount: integer("transaction_count").default(0),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  unq: unique().on(table.userId, table.portfolioId, table.date),
}));

// --- Asset Management Tables ---

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").unique().notNull(), // "BTC", "ETH", "SOL"
  name: text("name").notNull(),              // "Bitcoin", "Ethereum"
  type: text("type").default("CRYPTO"),      // CRYPTO, STABLECOIN, FIAT
  isActive: boolean("is_active").default(true),
  contentPath: text("content_path"),         // Path to .md file
  officialWebsite: text("official_website"),
  createdBy: text("created_by"),             // Creator/Founder name
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assetMetadata = pgTable("asset_metadata", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").references(() => assets.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unq: unique().on(table.assetId, table.key),
}));

export const priceSnapshots = pgTable("price_snapshots", {
  id: serial("id").primaryKey(),
  assetSymbol: text("asset_symbol").notNull().references(() => assets.symbol),
  priceThb: decimal("price_thb", { precision: 20, scale: 8 }).notNull(),
  source: text("source").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  metadata: jsonb("metadata"),
});

// --- Portfolio Coin Snapshots (Level 2) ---
// เก็บ snapshot รายเหรียญ รายพอร์ต รายวัน
export const portfolioCoinSnapshots = pgTable("portfolio_coin_snapshots", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  asset: text("asset").notNull(), // BTC, ETH, etc.
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  priceThb: decimal("price_thb", { precision: 20, scale: 8 }).notNull(),
  valueThb: decimal("value_thb", { precision: 20, scale: 2 }).notNull(),
  date: date("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // วันละหนึ่งรายการต่อ portfolio + asset
  unq: unique().on(table.portfolioId, table.asset, table.date),
}));
