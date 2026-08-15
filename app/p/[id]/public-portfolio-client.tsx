"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ArrowLeft, RefreshCw, Database, CheckCircle, XCircle,
} from "lucide-react";
import useSWR from "swr";
import { checkDatabaseHealth } from "@/actions/public-portfolio";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Holding {
  buy_price_usd_avg?: number | null;
  id: string;
  coin_id: string;
  amount: string;
  cost_thb: string | null;
  buy_price_thb: string | null;
  bought_at: Date;
  note: string | null;
  asset_symbol: string | null;
  asset_name: string | null;
  asset_image: string | null;
}

interface PricePoint {
  date: string;
  price_usd: number;
  price_thb: number | null;
  change_24h: number | null;
}

interface Props {
  portfolio: { id: string; name: string; description: string | null; created_at: Date | null };
  holdings: Holding[];
  currentPrices: Record<string, { price_usd: string; price_thb: string | null; change_24h: string | null }>;
  priceHistories: Record<string, PricePoint[]>;
  portfolioSnapshots?: { snapshot_date: string; total_value_thb: number; btc_price_thb?: number | null; trx_price_thb?: number | null }[];
  cashBalance: number;
  usdtPriceAtBuy?: Record<string, number | null>;
}

const COIN_COLORS: Record<string, string> = {
  bitcoin: "#F7931A",
  tron: "#FF0013",
  ethereum: "#627EEA",
  dogecoin: "#C2A633",
};

export default function PublicPortfolioClient({ portfolio, holdings, currentPrices: initialPrices, priceHistories, portfolioSnapshots, cashBalance, usdtPriceAtBuy = {} }: Props) {
  // Default: prefer BTC as the initially selected asset (so BTC chart shows first)
  // Fallback to first holding.coin_id or empty string
  const [currency, setCurrency] = useState<"usd" | "thb">("thb");
  const [dbHealth, setDbHealth] = useState<{ is_healthy: boolean | null; message: string; timestamp: string }>({
    is_healthy: null,
    message: "กำลังตรวจสอบ...",
    timestamp: "",
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const result = await checkDatabaseHealth();
      setDbHealth(result);
    } catch (err) {
      setDbHealth({ is_healthy: false, message: "เชื่อมต่อไม่ได้", timestamp: new Date().toISOString() });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    handleCheckHealth();
  }, []);

  const { data, isValidating } = useSWR(`/api/p/${portfolio.id}/prices`, fetcher, {
    fallbackData: { success: true, prices: initialPrices },
    refreshInterval: 60000, // อัปเดตราคาทุก 1 นาที
  });

  const prices = data?.prices ?? initialPrices;
  const exchangeRate = data?.exchange_rate?.usd_to_thb ?? null;
  const lastUpdated = data?.last_updated ?? null;

  const holdingValues = holdings.map((h) => {
    const price = prices[h.coin_id];
    const amount = Number(h.amount);
    const priceThb = price?.price_thb ? Number(price.price_thb) : 0;
    const priceUsd = price ? Number(price.price_usd) : 0;
    const change = price?.change_24h ? Number(price.change_24h) : 0;
    const costThb = Number(h.cost_thb ?? 0);
    // สูตรคำนวน: (ปริมาณเหรียญ × ราคา) × (1 - 0.25% ค่าธรรมเนียม)
    const FEE_RATE = 0.0025; // 0.25%
    const valueThb = (amount * priceThb) * (1 - FEE_RATE);
    const pnl = valueThb - costThb;
    const pnlPct = costThb > 0 ? (pnl / costThb) * 100 : 0;
    // Calculate average USDT price on purchase date
    const buyDateStr = new Date(h.bought_at).toISOString().split('T')[0];
    const pricePoints = priceHistories[h.coin_id] ?? [];
    const matchingPoints = pricePoints.filter(p => p.date === buyDateStr);
    const avgBuyUsd = matchingPoints.length > 0 ? matchingPoints.reduce((s, p) => s + p.price_usd, 0) / matchingPoints.length : null;
    return {
      ...h,
      amount,
      priceThb,
      priceUsd,
      valueThb,
      value_usd: (amount * priceUsd) * (1 - FEE_RATE),
      change,
      costThb,
      pnl,
      pnlPct,
      buy_price_usd_avg: avgBuyUsd,
    };
  });

  const totalCost = holdingValues.reduce((s, h) => s + h.costThb, 0);
  const totalValueThb = holdingValues.reduce((s, h) => s + h.valueThb, 0) + cashBalance; // รวมเงินสด
  const totalValueUsd = holdingValues.reduce((s, h) => s + h.value_usd, 0) + (exchangeRate ? cashBalance / exchangeRate : 0); // รวมเงินสดแปลงเป็น USD
  const totalPnl = totalValueThb - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;


  return (
    <div className="min-h-screen bg-[#00072D] text-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#0F1F55] bg-[#00072D]/95 backdrop-blur-[12px]">
        <div className="flex h-full items-center justify-between px-6 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.4)]">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-white text-[15px]">Micro Finance</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckHealth}
              disabled={isCheckingHealth}
              className={`flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold transition-all border ${dbHealth.is_healthy === true
                ? "border-[#00E676]/30 bg-[#00E676]/10 text-[#00E676]"
                : dbHealth.is_healthy === false
                  ? "border-[#FF5252]/30 bg-[#FF5252]/10 text-[#FF5252]"
                  : "border-[#0F1F55] text-[#A0A0B0]"
                } hover:brightness-110`}
              title={`Last check: ${dbHealth.timestamp}`}
            >
              <Database className={`h-3.5 w-3.5 ${isCheckingHealth ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">DB Status:</span>
              {dbHealth.is_healthy === true ? (
                <CheckCircle className="h-3 w-3" />
              ) : dbHealth.is_healthy === false ? (
                <XCircle className="h-3 w-3" />
              ) : null}
              <span>{dbHealth.is_healthy === true ? "Online" : dbHealth.is_healthy === false ? "Offline" : "Checking..."}</span>
            </button>
            <button onClick={() => setCurrency("thb")} className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currency === "thb" ? "bg-[#00D4FF] text-black" : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845]"}`}>THB</button>
            <button onClick={() => setCurrency("usd")} className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currency === "usd" ? "bg-[#00D4FF] text-black" : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845]"}`}>USD</button>
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
          <h1 className="text-3xl font-bold text-white">{portfolio.name}</h1>
          {portfolio.description && <p className="text-sm text-[#A0A0B0] mt-1">{portfolio.description}</p>}

          {/* Exchange Rate & Last Updated */}
          {(exchangeRate || lastUpdated) && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#A0A0B0]">
              {exchangeRate && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A1845] border border-[#0F1F55]">
                  <span className="text-[#00D4FF]">📊</span>
                  <span>USD/THB: <span className="font-semibold text-white">{exchangeRate.toFixed(2)}</span> <span className="text-[#5A6A9A]">(Bitkub)</span></span>
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A1845] border border-[#0F1F55]">
                  <span>🕒</span>
                  <span>อัปเดท: <span className="font-semibold text-white">{new Date(lastUpdated).toLocaleTimeString("th-TH")}</span></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Prices - BTC & TRX */}
        {holdingValues.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* แสดงเงินสดก่อน (ถ้ามี) */}
            {cashBalance > 0 && (
              <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white bg-[#00E676]">
                      ฿
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">เงินสด (THB)</p>
                      <p className="text-xs text-[#5A6A9A] mt-0.5">จากการขายสินทรัพย์</p>
                    </div>
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full font-semibold bg-[#00E676]/20 text-[#00E676]">
                    💰 Cash
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#A0A0B0] mb-2">มูลค่า</p>
                    <p className="text-3xl font-bold text-[#00E676]">
                      ฿{cashBalance.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                    </p>
                    {exchangeRate && (
                      <p className="text-sm text-[#A0A0B0] mt-1">
                        ${(cashBalance / exchangeRate).toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#0F1F55]">
                    <p className="text-xs text-[#A0A0B0]">
                      💡 เงินสดจากการขาย DOGE และ ETH
                    </p>
                  </div>
                </div>
              </div>
            )}

            {holdingValues.map((h) => (
              <div
                key={h.id}
                className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {h.asset_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.asset_image} alt={h.asset_name ?? ""} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: COIN_COLORS[h.coin_id] ?? "#00D4FF" }}>
                        {(h.asset_symbol ?? h.coin_id)[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-white">{h.asset_symbol ?? h.coin_id.toUpperCase()}</p>
                      <p className="text-xs text-[#5A6A9A] mt-0.5">{h.asset_name}</p>
                    </div>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${h.change >= 0 ? "bg-[#00E676]/20 text-[#00E676]" : "bg-[#FF5252]/20 text-[#FF5252]"}`}>
                    {h.change >= 0 ? "↑" : "↓"} {Math.abs(h.change).toFixed(2)}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#A0A0B0] mb-2">ราคาปัจจุบัน</p>
                    <p className="text-3xl font-bold text-white">
                      {currency === "thb" ? `฿${h.priceThb.toLocaleString("th-TH", { maximumFractionDigits: 2 })}` : `$${h.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 4 })}`}
                    </p>
                    <p className="text-sm text-[#A0A0B0] mb-2">ราคา​ซื้อ</p>
                    <p className="text-xl font-semibold text-white">@฿{Number(h.buy_price_thb ?? 0).toLocaleString("th-TH")}</p>
                    <p className="text-[10px] text-[#5A6A9A] mt-1.5 flex items-center gap-1">
                      <span>🕐</span>
                      <span>
                        ข้อมูล ณ{" "}
                        <span className="text-[#A0A0B0] font-medium" suppressHydrationWarning>
                          {new Date(lastUpdated ?? Date.now()).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            timeZone: "Asia/Bangkok",
                          })} น.
                        </span>
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A0A0B0] mb-2">ปริมาณถือครอง</p>
                    <p className="text-sm font-semibold text-white">{h.amount.toFixed(8)} เหรียญ</p>
                  </div>

                  <div className="pt-2 border-t border-[#0F1F55]">
                    <p className="text-xs text-[#A0A0B0] mb-2">มูลค่าสุทธิ (หักค่าธรรมเนียม 0.25%)</p>
                    <p className={`text-2xl font-bold ${h.pnl >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                      {currency === "thb"
                        ? `฿${h.valueThb.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                        : `$${h.value_usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                      }
                    </p>
                    <p className={`text-xs mt-2 ${h.pnl >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                      {h.pnl >= 0 ? "+" : ""}฿{h.pnl.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ({h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "มูลค่าปัจจุบัน",
              value: currency === "thb"
                ? `฿${totalValueThb.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                : `$${totalValueUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
              sub: null,
            },
            {
              label: "ต้นทุนรวม",
              value: `฿${totalCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`,
              sub: null,
            },
            {
              label: "กำไร/ขาดทุน",
              value: `${totalPnl >= 0 ? "+" : ""}฿${totalPnl.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`,
              sub: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`,
              positive: totalPnl >= 0,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
              <p className="text-xs text-[#A0A0B0] mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${"positive" in s ? (s.positive ? "text-[#00E676]" : "text-[#FF5252]") : "text-white"}`}>
                {s.value}
              </p>
              {s.sub && (
                <p className={`text-xs mt-1 ${"positive" in s ? (s.positive ? "text-[#00E676]" : "text-[#FF5252]") : "text-[#A0A0B0]"}`}>
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>


        {/* Buy Info */}
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <h2 className="text-base font-semibold text-white mb-4">ข้อมูลการซื้อ</h2>
          <div className="space-y-1">
            {holdingValues.map((h, i) => (
              <div key={h.id} className={`flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#0A1845] transition-colors ${i !== holdingValues.length - 1 ? "border-b border-[#0F1F55]/50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#00E676]/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#00E676]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">ซื้อ {h.asset_symbol ?? h.coin_id.toUpperCase()}</p>
                    <p className="text-xs text-[#5A6A9A]">
                      {new Date(h.bought_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                      {h.note ? ` · ${h.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#00E676]">+{h.amount.toFixed(8)}</p>
                  <p className="text-xs text-[#A0A0B0]">
                    ฿{Number(h.costThb).toLocaleString("th-TH")} · @฿{Number(h.buy_price_thb ?? 0).toLocaleString("th-TH")}
                  </p>
                  {(() => {
                    const usdtRate = usdtPriceAtBuy[h.id];
                    if (!usdtRate) return null;
                    const priceInUsdt = Number(h.buy_price_thb ?? 0) / usdtRate;
                    return (
                      <p className="text-xs text-[#5A6A9A] mt-0.5">
                        ≈ ${priceInUsdt.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDT
                        <span className="ml-1 text-[#3A4A7A]">(1 USDT = ฿{usdtRate.toFixed(2)})</span>
                      </p>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#5A6A9A]">© 2026 Microtronic Co., Ltd. · พอร์ตนี้เป็นตัวอย่างเพื่อการศึกษาเท่านั้น</p>
      </main>
    </div>
  );
}
