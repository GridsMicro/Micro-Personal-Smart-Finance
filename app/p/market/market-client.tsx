"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import useSWR from "swr";

const PORTFOLIO_ID = "a0000000-0000-0000-0000-000000000001";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketClient() {
  const { data, isValidating, mutate } = useSWR(
    `/api/p/${PORTFOLIO_ID}/prices`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const prices: Record<string, { price_usd: string; price_thb: string | null; change_24h: string | null }> =
    data?.prices ?? {};
  const exchangeRate: number | null = data?.exchange_rate?.usd_to_thb ?? null;
  const lastUpdated: string | null = data?.last_updated ?? null;

  const coins = Object.entries(prices).map(([id, p]) => ({
    id,
    price_usd: Number(p.price_usd),
    price_thb: p.price_thb ? Number(p.price_thb) : null,
    change_24h: p.change_24h ? Number(p.change_24h) : null,
  }));

  return (
    <div className="min-h-screen bg-[#00072D] text-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#0F1F55] bg-[#00072D]/95 backdrop-blur-[12px]">
        <div className="flex h-full items-center justify-between px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href={`/p/${PORTFOLIO_ID}`}
              className="flex items-center gap-1.5 text-sm text-[#A0A0B0] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Portfolio
            </Link>
            <span className="text-[#0F1F55]">/</span>
            <span className="text-sm font-semibold text-white">Market</span>
          </div>

          <div className="flex items-center gap-2">
            {exchangeRate && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A1845] border border-[#0F1F55] text-xs text-[#A0A0B0]">
                <span className="text-[#00D4FF]">📊</span>
                <span>USD/THB: <span className="font-semibold text-white">{exchangeRate.toFixed(2)}</span></span>
              </div>
            )}
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845] transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#5A6A9A] mb-3 px-2.5 py-1 rounded-full border border-[#0F1F55]">
            <div className={`h-1.5 w-1.5 rounded-full ${isValidating ? "bg-blue-400" : "bg-[#00E676]"} animate-pulse`} />
            {isValidating ? "กำลังอัปเดตราคา..." : "ราคาล่าสุด (Live)"}
          </div>
          <h1 className="text-3xl font-bold text-white">Market</h1>
          <p className="text-sm text-[#A0A0B0] mt-1">ราคาเหรียญ crypto real-time จาก Bitkub &amp; CoinGecko</p>
          {lastUpdated && (
            <p className="text-xs text-[#5A6A9A] mt-1">
              อัปเดท:{" "}
              <span className="text-[#A0A0B0]" suppressHydrationWarning>
                {new Date(lastUpdated).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: "Asia/Bangkok",
                })}{" "}
                น.
              </span>
            </p>
          )}
        </div>

        {/* Coin Table */}
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 sm:grid-cols-4 px-5 py-3 border-b border-[#0F1F55] text-xs text-[#5A6A9A] font-medium uppercase tracking-wide">
            <span>เหรียญ</span>
            <span className="text-right">ราคา (THB)</span>
            <span className="text-right hidden sm:block">ราคา (USD)</span>
            <span className="text-right">24h</span>
          </div>

          {coins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#5A6A9A]">
              <RefreshCw className="h-8 w-8 mb-3 animate-spin opacity-50" />
              <p className="text-sm">กำลังโหลดราคา...</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0F1F55]/50">
              {coins.map((coin) => {
                const change = coin.change_24h ?? 0;
                const isUp = change >= 0;
                return (
                  <div
                    key={coin.id}
                    className="grid grid-cols-3 sm:grid-cols-4 px-5 py-4 hover:bg-[#0A1845] transition-colors items-center"
                  >
                    {/* Coin ID */}
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: COIN_COLOR[coin.id] ?? "#1A2A5E" }}
                      >
                        {COIN_SYMBOL[coin.id]?.[0] ?? coin.id[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {COIN_SYMBOL[coin.id] ?? coin.id.toUpperCase()}
                        </p>
                        <p className="text-xs text-[#5A6A9A] capitalize">{coin.id}</p>
                      </div>
                    </div>

                    {/* THB */}
                    <p className="text-right text-sm font-semibold text-white">
                      {coin.price_thb != null
                        ? `฿${coin.price_thb.toLocaleString("th-TH", { maximumFractionDigits: coin.price_thb < 1 ? 6 : 2 })}`
                        : "—"}
                    </p>

                    {/* USD */}
                    <p className="text-right text-sm text-[#A0A0B0] hidden sm:block">
                      ${coin.price_usd.toLocaleString("en-US", { maximumFractionDigits: coin.price_usd < 1 ? 6 : 2 })}
                    </p>

                    {/* 24h Change */}
                    <div className="flex items-center justify-end gap-1">
                      {isUp ? (
                        <TrendingUp className="h-3.5 w-3.5 text-[#00E676]" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-[#FF5252]" />
                      )}
                      <span className={`text-sm font-semibold ${isUp ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                        {isUp ? "+" : ""}{change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#5A6A9A]">
          © 2026 Microtronic Co., Ltd. · ข้อมูลราคาจาก Bitkub &amp; CoinGecko
        </p>
      </main>
    </div>
  );
}

// Symbol map
const COIN_SYMBOL: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tron: "TRX",
  dogecoin: "DOGE",
  tether: "USDT",
  solana: "SOL",
  cardano: "ADA",
  ripple: "XRP",
  binancecoin: "BNB",
  "avalanche-2": "AVAX",
  polkadot: "DOT",
  "matic-network": "MATIC",
  litecoin: "LTC",
  near: "NEAR",
  "usd-coin": "USDC",
  ordi: "ORDI",
  "1000sats-ordinals": "SATS",
  goat: "GOAT",
  "moo-deng": "MOODENG",
};

const COIN_COLOR: Record<string, string> = {
  bitcoin: "#F7931A",
  ethereum: "#627EEA",
  tron: "#FF0013",
  dogecoin: "#C2A633",
  tether: "#26A17B",
  solana: "#9945FF",
  cardano: "#0033AD",
  ripple: "#346AA9",
  binancecoin: "#F3BA2F",
  "avalanche-2": "#E84142",
  polkadot: "#E6007A",
  "matic-network": "#8247E5",
  litecoin: "#BFBBBB",
  near: "#00C08B",
  "usd-coin": "#2775CA",
};
