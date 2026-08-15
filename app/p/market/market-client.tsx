"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, X, ExternalLink } from "lucide-react";
import useSWR from "swr";

const PORTFOLIO_ID = "a0000000-0000-0000-0000-000000000001";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// TradingView symbol mapping
// Primary: BITKUB:<SYMBOL>THB (ราคา THB ตรง)
// Fallback: BINANCE:<SYMBOL>USDT
const TV_SYMBOL: Record<string, string> = {
  bitcoin:            "BITKUB:BTCTHB",
  ethereum:           "BITKUB:ETHTHB",
  tron:               "BITKUB:TRXTHB",
  dogecoin:           "BITKUB:DOGETHB",
  tether:             "BINANCE:USDTUSDC",
  solana:             "BITKUB:SOLTHB",
  cardano:            "BITKUB:ADATHB",
  ripple:             "BITKUB:XRPTHB",
  binancecoin:        "BINANCE:BNBUSDT",
  "avalanche-2":      "BITKUB:AVAXTHB",
  polkadot:           "BITKUB:DOTTHB",
  "matic-network":    "BITKUB:MATICTHB",
  litecoin:           "BITKUB:LTCTHB",
  near:               "BITKUB:NEARTHB",
  "usd-coin":         "BINANCE:USDCUSDT",
  ordi:               "BINANCE:ORDIUSDT",
  "1000sats-ordinals":"BINANCE:SATSUSDT",
  goat:               "BINANCE:GOATUSDT",
  "moo-deng":         "BINANCE:MOODENGUSDT",
};

const COIN_SYMBOL: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", tron: "TRX", dogecoin: "DOGE",
  tether: "USDT", solana: "SOL", cardano: "ADA", ripple: "XRP",
  binancecoin: "BNB", "avalanche-2": "AVAX", polkadot: "DOT",
  "matic-network": "MATIC", litecoin: "LTC", near: "NEAR",
  "usd-coin": "USDC", ordi: "ORDI", "1000sats-ordinals": "SATS",
  goat: "GOAT", "moo-deng": "MOODENG",
};

const COIN_COLOR: Record<string, string> = {
  bitcoin: "#F7931A", ethereum: "#627EEA", tron: "#FF0013",
  dogecoin: "#C2A633", tether: "#26A17B", solana: "#9945FF",
  cardano: "#0033AD", ripple: "#346AA9", binancecoin: "#F3BA2F",
  "avalanche-2": "#E84142", polkadot: "#E6007A", "matic-network": "#8247E5",
  litecoin: "#BFBBBB", near: "#00C08B", "usd-coin": "#2775CA",
};

interface CoinData {
  id: string;
  price_usd: number;
  price_thb: number | null;
  change_24h: number | null;
}

// ── TradingView Widget ──────────────────────────────────────────────────────
function TradingViewWidget({ symbol, coinId }: { symbol: string; coinId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Asia/Bangkok",
      theme: "dark",
      style: "1",
      locale: "th",
      backgroundColor: "rgba(0, 7, 45, 1)",
      gridColor: "rgba(15, 31, 85, 0.5)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }} />
    </div>
  );
}

// ── Chart Modal ─────────────────────────────────────────────────────────────
function ChartModal({ coin, onClose }: { coin: CoinData; onClose: () => void }) {
  const symbol = TV_SYMBOL[coin.id] ?? `BINANCE:${COIN_SYMBOL[coin.id] ?? coin.id.toUpperCase()}USDT`;
  const change = coin.change_24h ?? 0;
  const isUp = change >= 0;

  // ปิดด้วย ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ป้องกัน scroll body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:w-[92vw] sm:max-w-5xl h-[92dvh] sm:h-[85vh] rounded-t-2xl sm:rounded-2xl border border-[#0F1F55] bg-[#00072D] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#0F1F55] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: COIN_COLOR[coin.id] ?? "#1A2A5E" }}
            >
              {(COIN_SYMBOL[coin.id] ?? coin.id)[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-white">
                  {COIN_SYMBOL[coin.id] ?? coin.id.toUpperCase()}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isUp ? "bg-[#00E676]/20 text-[#00E676]" : "bg-[#FF5252]/20 text-[#FF5252]"}`}>
                  {isUp ? "+" : ""}{change.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-[#5A6A9A]">{symbol}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ราคา */}
            <div className="hidden sm:block text-right mr-2">
              {coin.price_thb != null && (
                <p className="text-base font-bold text-white">
                  ฿{coin.price_thb.toLocaleString("th-TH", { maximumFractionDigits: coin.price_thb < 1 ? 6 : 2 })}
                </p>
              )}
              <p className="text-xs text-[#A0A0B0]">
                ${coin.price_usd.toLocaleString("en-US", { maximumFractionDigits: coin.price_usd < 1 ? 6 : 2 })}
              </p>
            </div>

            {/* TradingView link */}
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">TradingView</span>
            </a>

            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#FF5252]/10 hover:text-[#FF5252] hover:border-[#FF5252]/30 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 p-0">
          <TradingViewWidget symbol={symbol} coinId={coin.id} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MarketClient() {
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);

  const { data, isValidating, mutate } = useSWR(
    `/api/p/${PORTFOLIO_ID}/prices`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const prices: Record<string, { price_usd: string; price_thb: string | null; change_24h: string | null }> =
    data?.prices ?? {};
  const exchangeRate: number | null = data?.exchange_rate?.usd_to_thb ?? null;
  const lastUpdated: string | null = data?.last_updated ?? null;

  const coins: CoinData[] = Object.entries(prices).map(([id, p]) => ({
    id,
    price_usd: Number(p.price_usd),
    price_thb: p.price_thb ? Number(p.price_thb) : null,
    change_24h: p.change_24h ? Number(p.change_24h) : null,
  }));

  return (
    <>
      <div className="min-h-screen bg-[#00072D] text-white">
        {/* Navbar */}
        <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-[#0F1F55] bg-[#00072D]/95 backdrop-blur-[12px]">
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
            <p className="text-sm text-[#A0A0B0] mt-1">
              คลิกที่เหรียญเพื่อดู chart · ราคาจาก Bitkub &amp; CoinGecko
            </p>
            {lastUpdated && (
              <p className="text-xs text-[#5A6A9A] mt-1">
                อัปเดท:{" "}
                <span className="text-[#A0A0B0]" suppressHydrationWarning>
                  {new Date(lastUpdated).toLocaleTimeString("th-TH", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                    timeZone: "Asia/Bangkok",
                  })}{" "}น.
                </span>
              </p>
            )}
          </div>

          {/* Coin Table */}
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] overflow-hidden">
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
                  const hasTvSymbol = !!TV_SYMBOL[coin.id];

                  return (
                    <button
                      key={coin.id}
                      onClick={() => setSelectedCoin(coin)}
                      className="w-full grid grid-cols-3 sm:grid-cols-4 px-5 py-4 hover:bg-[#0A1845] active:bg-[#0F1F55] transition-colors items-center text-left group"
                    >
                      {/* Coin */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:scale-105 transition-transform"
                          style={{ background: COIN_COLOR[coin.id] ?? "#1A2A5E" }}
                        >
                          {COIN_SYMBOL[coin.id]?.[0] ?? coin.id[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {COIN_SYMBOL[coin.id] ?? coin.id.toUpperCase()}
                          </p>
                          <p className="text-xs text-[#5A6A9A] capitalize leading-tight">{coin.id}</p>
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

                      {/* 24h */}
                      <div className="flex items-center justify-end gap-1">
                        {isUp
                          ? <TrendingUp className="h-3.5 w-3.5 text-[#00E676]" />
                          : <TrendingDown className="h-3.5 w-3.5 text-[#FF5252]" />
                        }
                        <span className={`text-sm font-semibold ${isUp ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                          {isUp ? "+" : ""}{change.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-[#5A6A9A]">
            © 2026 Microtronic Co., Ltd. · Chart โดย TradingView
          </p>
        </main>
      </div>

      {/* Chart Modal */}
      {selectedCoin && (
        <ChartModal coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
      )}
    </>
  );
}
