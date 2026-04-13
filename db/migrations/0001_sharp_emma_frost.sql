ALTER TABLE "daily_snapshots" DROP CONSTRAINT "daily_snapshots_snapshot_date_unique";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP CONSTRAINT "mc_api_configurations_service_unique";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP CONSTRAINT "mc_crypto_coins_coin_id_unique";--> statement-breakpoint
ALTER TABLE "mc_session" DROP CONSTRAINT "mc_session_session_token_unique";--> statement-breakpoint
ALTER TABLE "mc_user" DROP CONSTRAINT "mc_user_email_unique";--> statement-breakpoint
ALTER TABLE "mc_website_settings" DROP CONSTRAINT "mc_website_settings_key_unique";--> statement-breakpoint
ALTER TABLE "news" DROP CONSTRAINT "news_slug_unique";--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP CONSTRAINT "admin_activity_logs_user_id_mc_user_id_fk";
--> statement-breakpoint
ALTER TABLE "market_prices" DROP CONSTRAINT "market_prices_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_account" DROP CONSTRAINT "mc_account_user_id_mc_user_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_categories" DROP CONSTRAINT "mc_categories_parent_id_mc_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP CONSTRAINT "mc_crypto_coins_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP CONSTRAINT "mc_crypto_history_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP CONSTRAINT "mc_portfolio_assets_portfolio_id_mc_portfolios_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP CONSTRAINT "mc_portfolio_assets_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP CONSTRAINT "mc_portfolio_snapshots_portfolio_id_mc_portfolios_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP CONSTRAINT "mc_portfolio_transactions_portfolio_id_mc_portfolios_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP CONSTRAINT "mc_portfolio_transactions_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP CONSTRAINT "mc_portfolios_user_id_mc_user_id_fk";
--> statement-breakpoint
ALTER TABLE "mc_session" DROP CONSTRAINT "mc_session_user_id_mc_user_id_fk";
--> statement-breakpoint
ALTER TABLE "news" DROP CONSTRAINT "news_category_id_news_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "price_alerts" DROP CONSTRAINT "price_alerts_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_assigned_to_mc_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ticket_replies" DROP CONSTRAINT "ticket_replies_user_id_mc_user_id_fk";
--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP CONSTRAINT "watchlist_items_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ALTER COLUMN "ip_address" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ALTER COLUMN "asset_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ALTER COLUMN "asset_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "symbol" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "type" SET DEFAULT 'CRYPTO';--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "broker_fees" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "broker_fees" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "broker_fees" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "economic_indices" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "economic_indices" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economic_indices" ALTER COLUMN "symbol" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "economic_indices" ALTER COLUMN "value" SET DATA TYPE numeric(20, 4);--> statement-breakpoint
ALTER TABLE "energy_prices" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "energy_prices" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "energy_prices" ALTER COLUMN "unit" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "energy_prices" ALTER COLUMN "price" SET DATA TYPE numeric(20, 4);--> statement-breakpoint
ALTER TABLE "login_history" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "login_history" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "login_history" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "login_history" ALTER COLUMN "ip_address" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "login_history" ALTER COLUMN "location" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "market_prices" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "market_prices" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "market_prices" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "market_prices" ALTER COLUMN "source" SET DEFAULT 'COINGECKO';--> statement-breakpoint
ALTER TABLE "market_prices" ALTER COLUMN "source" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "market_prices" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "market_snapshots" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "market_snapshots" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_account" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_account" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_account" ALTER COLUMN "provider" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_account" ALTER COLUMN "token_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_account" ALTER COLUMN "scope" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_account" ALTER COLUMN "session_state" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_categories" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_categories" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ALTER COLUMN "symbol" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_menus" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_menus" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_pages" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_pages" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ALTER COLUMN "type" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ALTER COLUMN "total" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ALTER COLUMN "total" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolios" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_portfolios" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_portfolios" ALTER COLUMN "name" SET DEFAULT 'My Portfolio';--> statement-breakpoint
ALTER TABLE "mc_user" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_user" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mc_user" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_user" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mc_user" ALTER COLUMN "role" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "mc_user" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "mc_website_settings" ADD PRIMARY KEY ("key");--> statement-breakpoint
ALTER TABLE "mc_website_settings" ALTER COLUMN "key" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "published_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "category_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "news_categories" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news_categories" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "news_categories" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news_categories" ALTER COLUMN "slug" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "news_categories" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "price_alerts" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "price_alerts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "price_alerts" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "price_alerts" ALTER COLUMN "target_price" SET DATA TYPE numeric(20, 8);--> statement-breakpoint
ALTER TABLE "price_alerts" ALTER COLUMN "target_price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "price_alerts" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_indices" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "stock_indices" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "stock_indices" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stock_indices" ALTER COLUMN "symbol" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stock_indices" ALTER COLUMN "change_percent" SET DATA TYPE numeric(20, 4);--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "subject" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "priority" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "priority" SET DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "assigned_to" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_replies" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ticket_replies" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ticket_replies" ALTER COLUMN "ticket_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ticket_replies" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ticket_replies" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'dark';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "currency" SET DEFAULT 'THB';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "language" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "language" SET DEFAULT 'th';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "timezone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Bangkok';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "watchlist_items" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "watchlist_items" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "watchlist_items" ALTER COLUMN "watchlist_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "watchlists" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "watchlists" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "watchlists" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "watchlists" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "watchlists" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "watchlists" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_account" ADD CONSTRAINT "mc_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId");--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD COLUMN "admin_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD COLUMN "target_type" text;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD COLUMN "target_id" text;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "secret" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "endpoint" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "usage_limit" integer;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "current_usage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "last_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ADD COLUMN "language" text DEFAULT 'th';--> statement-breakpoint
ALTER TABLE "asset_descriptions" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "asset_descriptions" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "content_path" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "official_website" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "broker_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "spot_maker_fee" numeric(5, 3) DEFAULT '0.100' NOT NULL;--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "spot_taker_fee" numeric(5, 3) DEFAULT '0.100' NOT NULL;--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "withdrawal_fee" numeric(20, 8) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "withdrawal_fee_currency" text DEFAULT 'THB';--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "min_withdrawal" numeric(20, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "broker_fees" ADD COLUMN "deposit_fee" numeric(20, 8) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD COLUMN "total_value" numeric(20, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD COLUMN "fiat_code" text DEFAULT 'THB' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD COLUMN "holdings_json" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "economic_indices" ADD COLUMN "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "economic_indices" ADD COLUMN "change_24h" numeric(20, 4);--> statement-breakpoint
ALTER TABLE "economic_indices" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "economic_indices" ADD COLUMN "source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "economic_indices" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "economic_indices" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "energy_prices" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "energy_prices" ADD COLUMN "brand" text NOT NULL;--> statement-breakpoint
ALTER TABLE "energy_prices" ADD COLUMN "product" text NOT NULL;--> statement-breakpoint
ALTER TABLE "energy_prices" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "energy_prices" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "login_history" ADD COLUMN "device_info" text;--> statement-breakpoint
ALTER TABLE "login_history" ADD COLUMN "success" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "login_history" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "login_history" ADD COLUMN "logged_in_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "login_history" ADD COLUMN "logged_out_at" timestamp;--> statement-breakpoint
ALTER TABLE "market_prices" ADD COLUMN "asset" text DEFAULT 'BTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "market_prices" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "market_prices" ADD COLUMN "price_thb" numeric(20, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "market_prices" ADD COLUMN "price_usd" numeric(20, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "data" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_account" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_account" ADD COLUMN "providerAccountId" text;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ADD COLUMN "endpointUrl" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ADD COLUMN "method" varchar(20) DEFAULT 'GET';--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "mc_api_configurations" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_categories" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ADD COLUMN "apiId" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ADD COLUMN "isActive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ADD COLUMN "sortOrder" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ADD COLUMN "coinId" text;--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ADD COLUMN "priceUsd" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ADD COLUMN "volume24h" text;--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ADD COLUMN "marketCap" text;--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ADD COLUMN "recordedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_menus" ADD COLUMN "label" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_menus" ADD COLUMN "url" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_menus" ADD COLUMN "position" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_menus" ADD COLUMN "sortOrder" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "mc_menus" ADD COLUMN "icon" varchar(50);--> statement-breakpoint
ALTER TABLE "mc_pages" ADD COLUMN "categoryId" text;--> statement-breakpoint
ALTER TABLE "mc_pages" ADD COLUMN "isPublished" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "mc_pages" ADD COLUMN "authorId" text;--> statement-breakpoint
ALTER TABLE "mc_pages" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_pages" ADD COLUMN "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ADD COLUMN "portfolioid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ADD COLUMN "coinid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ADD COLUMN "createdat" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" ADD COLUMN "portfolioid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" ADD COLUMN "snapshotdata" jsonb;--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" ADD COLUMN "recordedat" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "portfolioid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "coinid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "amount" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "currency" varchar(10) DEFAULT 'USDT';--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "exchangerate" text;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD COLUMN "createdat" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_portfolios" ADD COLUMN "userid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_portfolios" ADD COLUMN "isdefault" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "mc_portfolios" ADD COLUMN "createdat" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_session" ADD COLUMN "sessionToken" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_session" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mc_user" ADD COLUMN "emailVerified" timestamp;--> statement-breakpoint
ALTER TABLE "mc_user" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "mc_user" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mc_website_settings" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "mc_website_settings" ADD COLUMN "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "price_alerts" ADD COLUMN "asset_symbol" text NOT NULL;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD COLUMN "condition" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_indices" ADD COLUMN "price" numeric(20, 4) NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_indices" ADD COLUMN "is_closed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_indices" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "stock_indices" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_indices" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "ticket_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD COLUMN "is_staff" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "email_notifications" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "push_notifications" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "price_alert_threshold" numeric(5, 2) DEFAULT '5.00';--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN "asset_symbol" text NOT NULL;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN "added_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "watchlists" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD CONSTRAINT "daily_snapshots_user_id_mc_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mc_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_account" ADD CONSTRAINT "mc_account_userId_mc_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mc_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_crypto_history" ADD CONSTRAINT "mc_crypto_history_coinId_mc_crypto_coins_id_fk" FOREIGN KEY ("coinId") REFERENCES "public"."mc_crypto_coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_pages" ADD CONSTRAINT "mc_pages_categoryId_mc_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."mc_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_pages" ADD CONSTRAINT "mc_pages_authorId_mc_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."mc_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ADD CONSTRAINT "mc_portfolio_assets_portfolioid_mc_portfolios_id_fk" FOREIGN KEY ("portfolioid") REFERENCES "public"."mc_portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" ADD CONSTRAINT "mc_portfolio_assets_coinid_mc_crypto_coins_id_fk" FOREIGN KEY ("coinid") REFERENCES "public"."mc_crypto_coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" ADD CONSTRAINT "mc_portfolio_snapshots_portfolioid_mc_portfolios_id_fk" FOREIGN KEY ("portfolioid") REFERENCES "public"."mc_portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD CONSTRAINT "mc_portfolio_transactions_portfolioid_mc_portfolios_id_fk" FOREIGN KEY ("portfolioid") REFERENCES "public"."mc_portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" ADD CONSTRAINT "mc_portfolio_transactions_coinid_mc_crypto_coins_id_fk" FOREIGN KEY ("coinid") REFERENCES "public"."mc_crypto_coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_portfolios" ADD CONSTRAINT "mc_portfolios_userid_mc_user_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."mc_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mc_session" ADD CONSTRAINT "mc_session_userId_mc_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."mc_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_category_id_news_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."news_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_mc_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."mc_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_user_id_mc_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mc_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP COLUMN "entity_type";--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP COLUMN "entity_id";--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP COLUMN "old_value";--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP COLUMN "new_value";--> statement-breakpoint
ALTER TABLE "admin_activity_logs" DROP COLUMN "user_agent";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "service";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "key_name";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "encrypted_key";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "rate_limit";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "usage_count";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "last_used";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "website";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "whitepaper";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "technology";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "team";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "market_cap";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "volume_24h";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "circulating_supply";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "total_supply";--> statement-breakpoint
ALTER TABLE "asset_descriptions" DROP COLUMN "max_supply";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "exchange";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "broker_fees" DROP COLUMN "broker_name";--> statement-breakpoint
ALTER TABLE "broker_fees" DROP COLUMN "fee_type";--> statement-breakpoint
ALTER TABLE "broker_fees" DROP COLUMN "fee_value";--> statement-breakpoint
ALTER TABLE "broker_fees" DROP COLUMN "fee_structure";--> statement-breakpoint
ALTER TABLE "broker_fees" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "broker_fees" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "daily_snapshots" DROP COLUMN "snapshot_date";--> statement-breakpoint
ALTER TABLE "daily_snapshots" DROP COLUMN "data";--> statement-breakpoint
ALTER TABLE "daily_snapshots" DROP COLUMN "summary";--> statement-breakpoint
ALTER TABLE "economic_indices" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "economic_indices" DROP COLUMN "change";--> statement-breakpoint
ALTER TABLE "economic_indices" DROP COLUMN "change_percent";--> statement-breakpoint
ALTER TABLE "economic_indices" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "economic_indices" DROP COLUMN "recorded_at";--> statement-breakpoint
ALTER TABLE "economic_indices" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "energy_prices" DROP COLUMN "commodity";--> statement-breakpoint
ALTER TABLE "energy_prices" DROP COLUMN "change";--> statement-breakpoint
ALTER TABLE "energy_prices" DROP COLUMN "change_percent";--> statement-breakpoint
ALTER TABLE "energy_prices" DROP COLUMN "recorded_at";--> statement-breakpoint
ALTER TABLE "energy_prices" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "login_history" DROP COLUMN "device";--> statement-breakpoint
ALTER TABLE "login_history" DROP COLUMN "browser";--> statement-breakpoint
ALTER TABLE "login_history" DROP COLUMN "os";--> statement-breakpoint
ALTER TABLE "login_history" DROP COLUMN "is_success";--> statement-breakpoint
ALTER TABLE "login_history" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "bid";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "ask";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "volume";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "high_24h";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "low_24h";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "change_24h";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "change_percent_24h";--> statement-breakpoint
ALTER TABLE "market_prices" DROP COLUMN "last_updated";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "total_market_cap";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "total_volume_24h";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "btc_dominance";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "eth_dominance";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "fear_greed_index";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "active_cryptocurrencies";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "active_exchanges";--> statement-breakpoint
ALTER TABLE "market_snapshots" DROP COLUMN "snapshot_date";--> statement-breakpoint
ALTER TABLE "mc_account" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "mc_account" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "mc_account" DROP COLUMN "provider_account_id";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "service";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "base_url";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "endpoints";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "rate_limit";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_api_configurations" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_categories" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "mc_categories" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "mc_categories" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "mc_categories" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "mc_categories" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_categories" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "coin_id";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "rank";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "platform_id";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "contract_address";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "volume_24h";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "market_cap";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "price_change_1h";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "price_change_24h";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "price_change_7d";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "recorded_at";--> statement-breakpoint
ALTER TABLE "mc_crypto_history" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_menus" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "mc_menus" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "mc_menus" DROP COLUMN "items";--> statement-breakpoint
ALTER TABLE "mc_menus" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "mc_menus" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_menus" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_pages" DROP COLUMN "meta_title";--> statement-breakpoint
ALTER TABLE "mc_pages" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "mc_pages" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "mc_pages" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "mc_pages" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_pages" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "portfolio_id";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "average_price";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_portfolio_assets" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "portfolio_id";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "total_value";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "total_cost";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "unrealized_pnl";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "realized_pnl";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "snapshot_date";--> statement-breakpoint
ALTER TABLE "mc_portfolio_snapshots" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "portfolio_id";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "fee";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "transaction_date";--> statement-breakpoint
ALTER TABLE "mc_portfolio_transactions" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP COLUMN "is_default";--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_portfolios" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_session" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "mc_session" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "mc_session" DROP COLUMN "session_token";--> statement-breakpoint
ALTER TABLE "mc_user" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "mc_user" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "mc_user" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_user" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "mc_user" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "mc_user" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "mc_website_settings" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "mc_website_settings" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "mc_website_settings" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "mc_website_settings" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mc_website_settings" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "news_categories" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "news_categories" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "read_at";--> statement-breakpoint
ALTER TABLE "price_alerts" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "price_alerts" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "price_alerts" DROP COLUMN "percent_change";--> statement-breakpoint
ALTER TABLE "price_alerts" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "stock_indices" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "stock_indices" DROP COLUMN "change";--> statement-breakpoint
ALTER TABLE "stock_indices" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "stock_indices" DROP COLUMN "recorded_at";--> statement-breakpoint
ALTER TABLE "stock_indices" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "support_tickets" DROP COLUMN "closed_at";--> statement-breakpoint
ALTER TABLE "ticket_replies" DROP COLUMN "is_internal";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "notifications";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "preferences";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP COLUMN "alert_enabled";--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "broker_fees" ADD CONSTRAINT "broker_fees_broker_id_unique" UNIQUE("broker_id");--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD CONSTRAINT "daily_snapshots_user_id_date_unique" UNIQUE("user_id","date");--> statement-breakpoint
ALTER TABLE "economic_indices" ADD CONSTRAINT "economic_indices_category_symbol_date_unique" UNIQUE("category","symbol","date");--> statement-breakpoint
ALTER TABLE "energy_prices" ADD CONSTRAINT "energy_prices_brand_product_date_unique" UNIQUE("brand","product","date");--> statement-breakpoint
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_date_asset_unique" UNIQUE("date","asset");--> statement-breakpoint
ALTER TABLE "mc_crypto_coins" ADD CONSTRAINT "mc_crypto_coins_apiId_unique" UNIQUE("apiId");--> statement-breakpoint
ALTER TABLE "stock_indices" ADD CONSTRAINT "stock_indices_symbol_date_unique" UNIQUE("symbol","date");--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number");--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_asset_unique" UNIQUE("watchlist_id","asset_symbol");