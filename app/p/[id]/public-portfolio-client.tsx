"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";

interface Holding {
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
}

const COIN_COLORS: Record<string, string> = {
  bitcoin: "#F7931A",
  tron: "#FF0013",
};

export default function PublicPortfolioClient({ portfolio, holdings, currentPrices, priceHistories }: Props) {
  const [activeCoin, setActiveCoin] = useState(holdings[0]?.coin_id ?? "");
  const [currency, setCurrency] = useState<"usd" | "thb">("thb");

  const holdingValues = holdings.map((h) => {
    const price = currentPrices[h.coin_id];
    const amount = Number(h.amount);
    const priceThb = price?.price_thb ? Number(price.price_thb) : 0;
    const priceUsd = price ? Number(price.price_usd) : 0;
    const change = price?.change_24h ? Number(price.change_24h) : 0;
    const costThb = Number(h.cost_thb ?? 0);
    const valueThb = amount * priceThb;
    const pnl = valueThb - costThb;
    const pnlPct = costThb > 0 ? (pnl / costThb) * 100 : 0;
    return { ...h, amount, priceThb, priceUsd, valueThb, value_usd: amount * priceUsd, change, costThb, pnl, pnlPct };
  });

  const totalCost = holdingValues.reduce((s, h) => s + h.costThb, 0);
  const totalValueThb = holdingValues.reduce((s, h) => s + h.valueThb, 0);
  const totalValueUsd = holdingValues.reduce((s, h) => s + h.value_usd, 0);
  const totalPnl = totalValueThb - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const chartData = priceHistories[activeCoin] ?? [];

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
            <button onClick={() => setCurrency("thb")} className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currency === "thb" ? "bg-[#00D4FF] text-black" : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845]"}`}>THB</button>
            <button onClick={() => setCurrency("usd")} className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currency === "usd" ? "bg-[#00D4FF] text-black" : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845]"}`}>USD</button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#5A6A9A] mb-3 px-2.5 py-1 rounded-full border border-[#0F1F55]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00E676] animate-pulse" />
            พอร์ตตัวอย่างสาธารณะ
          </div>
          <h1 className="text-3xl font-bold text-white">{portfolio.name}</h1>
          {portfolio.description && <p className="text-sm text-[#A0A0B0] mt-1">{portfolio.description}</p>}
        </div>

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

        {/* Holdings */}
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <h2 className="text-base font-semibold text-white mb-4">สินทรัพย์ที่ถือครอง</h2>
          <div className="space-y-3">
            {holdingValues.map((h) => (
              <div
                key={h.id}
                onClick={() => setActiveCoin(h.coin_id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${activeCoin === h.coin_id ? "bg-[#0A1845] border border-[#162660]" : "hover:bg-[#0A1845]/50"}`}
              >
                <div className="flex items-center gap-3">
                  {h.asset_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.asset_image} alt={h.asset_name ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: COIN_COLORS[h.coin_id] ?? "#00D4FF" }}>
                      {(h.asset_symbol ?? h.coin_id)[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{h.asset_symbol ?? h.coin_id.toUpperCase()}</p>
                    <p className="text-xs text-[#5A6A9A]">{h.amount.toFixed(8)} เหรียญ</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {currency === "thb"
                      ? `฿${h.valueThb.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                      : `$${h.value_usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    <span className={`text-xs ${h.pnl >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                      {h.pnl >= 0 ? "+" : ""}฿{h.pnl.toLocaleString("th-TH", { maximumFractionDigits: 0 })} ({h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(2)}%)
                    </span>
                    <span className={`text-xs flex items-center gap-0.5 ${h.change >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                      {h.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(h.change).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">
              ประวัติราคา — {holdingValues.find((h) => h.coin_id === activeCoin)?.asset_symbol ?? activeCoin.toUpperCase()}
            </h2>
            <div className="flex gap-1">
              {holdings.map((h) => (
                <button
                  key={h.coin_id}
                  onClick={() => setActiveCoin(h.coin_id)}
                  className="h-7 px-3 rounded-md text-xs font-semibold transition-all"
                  style={activeCoin === h.coin_id
                    ? { background: COIN_COLORS[h.coin_id] ?? "#00D4FF", color: "#fff" }
                    : { background: "transparent", color: "#5A6A9A", border: "1px solid #0F1F55" }
                  }
                >
                  {h.asset_symbol ?? h.coin_id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center rounded-lg border border-[#0F1F55] bg-[#030B2A]">
              <TrendingUp className="h-10 w-10 text-[#0F1F55] mb-3" />
              <p className="text-sm text-[#5A6A9A]">ยังไม่มีประวัติราคา</p>
              <p className="text-xs text-[#5A6A9A] mt-1">ระบบบันทึกราคาทุกวัน 06:00 น.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COIN_COLORS[activeCoin] ?? "#00D4FF"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COIN_COLORS[activeCoin] ?? "#00D4FF"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0F1F55" />
                <XAxis dataKey="date" tick={{ fill: "#5A6A9A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5A6A9A", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => currency === "thb" ? `฿${Number(v).toLocaleString()}` : `$${Number(v).toLocaleString()}`}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ background: "#071442", border: "1px solid #0F1F55", borderRadius: 8 }}
                  labelStyle={{ color: "#A0A0B0", fontSize: 12 }}
                  formatter={(value) => [
                    currency === "thb" ? `฿${Number(value).toLocaleString("th-TH")}` : `$${Number(value).toLocaleString("en-US")}`,
                    "ราคา"
                  ]}
                />
                <Area type="monotone" dataKey={currency === "thb" ? "price_thb" : "price_usd"}
                  stroke={COIN_COLORS[activeCoin] ?? "#00D4FF"} strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
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
