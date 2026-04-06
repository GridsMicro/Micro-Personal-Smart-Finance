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
