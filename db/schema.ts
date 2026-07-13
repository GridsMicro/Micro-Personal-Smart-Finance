import { pgTable, varchar, text, timestamp, integer, boolean, jsonb, primaryKey, numeric, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const mcUser = pgTable("mc_user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  email_verified: timestamp("email_verified"),
  image: text("image"),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const mcAccount = pgTable(
  "mc_account",
  {
    user_id: text("user_id").notNull().references(() => mcUser.id),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    provider_account_id: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({ pk: primaryKey({ columns: [table.provider, table.provider_account_id] }) })
);

export const mcSession = pgTable("mc_session", {
  session_token: text("session_token").primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id),
  expires: timestamp("expires").notNull(),
});

export const verificationToken = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.identifier, table.token] }) })
);

export const mcPortfolios = pgTable("mc_portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id),
  name: varchar("name", { length: 255 }).notNull(),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const mcPortfolioAssets = pgTable("mc_portfolio_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolio_id: uuid("portfolio_id").notNull().references(() => mcPortfolios.id, { onDelete: "cascade" }),
  coin_id: varchar("coin_id", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 36, scale: 18 }).default("0"),
  created_at: timestamp("created_at").defaultNow(),
});

export const mcPortfolioTransactions = pgTable("mc_portfolio_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolio_id: uuid("portfolio_id").notNull().references(() => mcPortfolios.id, { onDelete: "cascade" }),
  coin_id: varchar("coin_id", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
  price_per_unit: numeric("price_per_unit", { precision: 36, scale: 18 }),
  total_value: numeric("total_value", { precision: 36, scale: 18 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  exchange_rate: numeric("exchange_rate", { precision: 36, scale: 18 }).default("1"),
  note: text("note"),
  created_at: timestamp("created_at").defaultNow(),
});

export const mcPortfolioSnapshots = pgTable("mc_portfolio_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolio_id: uuid("portfolio_id").notNull().references(() => mcPortfolios.id, { onDelete: "cascade" }),
  snapshot_data: jsonb("snapshot_data").notNull(),
  total_value_usd: numeric("total_value_usd", { precision: 36, scale: 18 }),
  recorded_at: timestamp("recorded_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: varchar("id", { length: 100 }).primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).default("crypto"),
  is_active: boolean("is_active").default(true),
  image_url: text("image_url"),
  official_website: text("official_website"),
  created_at: timestamp("created_at").defaultNow(),
  // ราคา: coingecko | bitkub | manual
  price_source: varchar("price_source", { length: 50 }).default("coingecko"),
  // CoinGecko ID สำหรับดึงราคา เช่น "bitcoin", "avalanche-2"
  coingecko_id: varchar("coingecko_id", { length: 100 }),
});

export const marketPrices = pgTable("market_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  asset_id: varchar("asset_id", { length: 100 }).notNull().references(() => assets.id),
  price_usd: numeric("price_usd", { precision: 36, scale: 18 }).notNull(),
  price_thb: numeric("price_thb", { precision: 36, scale: 18 }),
  change_24h: numeric("change_24h", { precision: 10, scale: 5 }),
  volume_24h: numeric("volume_24h", { precision: 36, scale: 18 }),
  market_cap: numeric("market_cap", { precision: 36, scale: 18 }),
  last_updated: timestamp("last_updated").defaultNow(),
});

export const assetPricesHistory = pgTable("asset_prices_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  asset_id: varchar("asset_id", { length: 100 }).notNull().references(() => assets.id),
  price_usd: numeric("price_usd", { precision: 36, scale: 18 }).notNull(),
  recorded_at: timestamp("recorded_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id).unique(),
  theme: varchar("theme", { length: 20 }).default("dark"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  language: varchar("language", { length: 5 }).default("th"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Bangkok"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id),
  name: varchar("name", { length: 255 }).notNull(),
  is_default: boolean("is_default").default(false),
});

export const watchlistItems = pgTable("watchlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  watchlist_id: uuid("watchlist_id").references(() => watchlists.id, { onDelete: "cascade" }),
  asset_id: varchar("asset_id", { length: 100 }).notNull(),
  added_at: timestamp("added_at").defaultNow(),
});

export const newsCategories = pgTable("news_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const news = pgTable("news", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  image_url: text("image_url"),
  source: varchar("source", { length: 255 }).notNull(),
  source_url: text("source_url"),
  category_id: uuid("category_id").references(() => newsCategories.id, { onDelete: "set null" }),
  published_at: timestamp("published_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false),
  data: jsonb("data"),
  created_at: timestamp("created_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id),
  ticket_number: varchar("ticket_number", { length: 50 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  created_at: timestamp("created_at").defaultNow(),
});

export const ticketReplies = pgTable("ticket_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticket_id: uuid("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const loginHistory = pgTable("login_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id").notNull().references(() => mcUser.id),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  logged_in_at: timestamp("logged_in_at").defaultNow(),
});

// ============================================
// SPECIAL PORTFOLIO (Public — standalone)
// ============================================

export const specialPortfolio = pgTable("special_portfolio", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  is_public: boolean("is_public").default(true),
  cash_balance_thb: numeric("cash_balance_thb", { precision: 36, scale: 18 }).default("0"),
  created_at: timestamp("created_at").defaultNow(),
});

export const specialPortfolioHoldings = pgTable("special_portfolio_holdings", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolio_id: uuid("portfolio_id").notNull().references(() => specialPortfolio.id, { onDelete: "cascade" }),
  coin_id: varchar("coin_id", { length: 100 }).notNull().references(() => assets.id),
  amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
  cost_thb: numeric("cost_thb", { precision: 36, scale: 18 }),
  buy_price_thb: numeric("buy_price_thb", { precision: 36, scale: 18 }),
  bought_at: timestamp("bought_at").notNull(),
  note: text("note"),
});

export const specialPortfolioSnapshots = pgTable("special_portfolio_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolio_id: uuid("portfolio_id").notNull().references(() => specialPortfolio.id, { onDelete: "cascade" }),
  snapshot_data: jsonb("snapshot_data").notNull(),
  // Per-day explicit prices for primary assets in the special portfolio
  btc_price_thb: numeric("btc_price_thb", { precision: 36, scale: 18 }),
  trx_price_thb: numeric("trx_price_thb", { precision: 36, scale: 18 }),
  // Total portfolio value (explicit decimal field) — kept for compatibility
  total_value_thb: numeric("total_value_thb", { precision: 36, scale: 18 }),
  // New canonical total field requested by product owners
  total_thb: numeric("total_thb", { precision: 36, scale: 18 }),
  recorded_at: timestamp("recorded_at").defaultNow(),
});

export const cronLogs = pgTable("cron_logs", {
  id: integer("id").primaryKey().default(sql`nextval('public.cron_logs_id_seq')`),
  job: varchar("job", { length: 255 }).notNull(),
  attempts: integer("attempts").notNull(),
  success: boolean("success").notNull(),
  message: text("message"),
  payload: jsonb("payload"),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================
// MARKET COMPARISON & ANALYSIS
// ============================================

export const marketComparison = pgTable("market_comparison", {
  id: uuid("id").defaultRandom().primaryKey(),
  asset_id: varchar("asset_id", { length: 100 }).notNull().references(() => assets.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  
  // Prices from different sources
  bitkub_price_thb: numeric("bitkub_price_thb", { precision: 36, scale: 18 }),
  binance_price_usd: numeric("binance_price_usd", { precision: 36, scale: 18 }),
  okx_price_usd: numeric("okx_price_usd", { precision: 36, scale: 18 }),
  
  // Computed values
  avg_price_usd: numeric("avg_price_usd", { precision: 36, scale: 18 }),
  spread_percentage: numeric("spread_percentage", { precision: 10, scale: 5 }), // Gap between highest and lowest
  
  // Analysis
  recommendation: varchar("recommendation", { length: 50 }), // BUY, SELL, HOLD, ARBITRAGE
  analysis_note: text("analysis_note"),
  
  recorded_at: timestamp("recorded_at").defaultNow(),
});

export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id", { length: 20 }).primaryKey(), // e.g., "USD_THB"
  rate: numeric("rate", { precision: 36, scale: 18 }).notNull(),
  source: varchar("source", { length: 50 }).default("bot"), // Bank of Thailand or other
  last_updated: timestamp("last_updated").defaultNow(),
});

export const tradingviewSignals = pgTable("tradingview_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  interval: varchar("interval", { length: 10 }).notNull(), // 1m, 5m, 1h, 1d
  signal: varchar("signal", { length: 20 }).notNull(), // STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL
  indicator_data: jsonb("indicator_data"), // RSI, MACD, EMA values
  recorded_at: timestamp("recorded_at").defaultNow(),
});

export type User = typeof mcUser.$inferSelect;
export type Portfolio = typeof mcPortfolios.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Transaction = typeof mcPortfolioTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NewsItem = typeof news.$inferSelect;
