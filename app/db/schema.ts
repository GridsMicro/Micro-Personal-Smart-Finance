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
  broker: text("broker").notNull().default("BINANCE_TH"), // BINANCE_TH, BITKUB, OKX
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
