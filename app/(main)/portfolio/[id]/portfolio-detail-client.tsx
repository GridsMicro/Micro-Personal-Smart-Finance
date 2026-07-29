"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Clock, ArrowUpRight } from "lucide-react";

interface Holding {
  id: string;
  portfolio_id: string;
  coin_id: string;
  amount: string | null;
  created_at: Date | null;
}

interface Transaction {
  id: string;
  coin_id: string;
  type: string;
  amount: string;
  price_per_unit: string | null;
  total_value: string | null;
  currency: string | null;
  note: string | null;
  created_at: Date | null;
}

interface PricePoint {
  date: string;
  price_usd: number;
  price_thb: number | null;
  change_24h: number | null;
}

interface Portfolio {
  id: string;
  name: string;
  user_id: string;
  is_default: boolean | null;
  created_at: Date | null;
}

interface CurrentPrice {
  price_usd: string;
  price_thb: string | null;
  change_24h: string | null;
}

interface Props {
  portfolio: Portfolio;
  holdings: Holding[];
  transactions: Transaction[];
  currentPrices: Record<string, CurrentPrice>;
  priceHistories: Record<string, PricePoint[]>;
}

const COIN_COLORS: Record<string, string> = {
  bitcoin: "#F7931A",
  tron: "#FF0013",
};

const COIN_LABELS: Record<string, string> = {
  bitcoin: "BTC",
  tron: "TRX",
};

export default function PortfolioDetailClient({
  portfolio,
  holdings,
  transactions,
  currentPrices,
  priceHistories,
}: Props) {
  const [activeCoin, setActiveCoin] = useState<string>(holdings[0]?.coin_id ?? "");
  const [currency, setCurrency] = useState<"usd" | "thb">("thb");

  // คำนวณมูลค่าปัจจุบันของแต่ละ holding
  const holdingValues = holdings.map((h) => {
    const price = currentPrices[h.coin_id];
    const amount = Number(h.amount ?? 0);
    const priceUsd = price ? Number(price.price_usd) : 0;
    const priceThb = price?.price_thb ? Number(price.price_thb) : 0;
    const change = price?.change_24h ? Number(price.change_24h) : 0;
    return {
      ...h,
      amount,
      price_usd: priceUsd,
      price_thb: priceThb,
      value_usd: amount * priceUsd,
      value_thb: amount * priceThb,
      change_24h: change,
    };
  });

  const totalValueThb = holdingValues.reduce((s, h) => s + h.value_thb, 0);
  const totalValueUsd = holdingValues.reduce((s, h) => s + h.value_usd, 0);
  const totalCost = transactions
    .filter((t) => t.type === "buy")
    .reduce((s, t) => s + Number(t.total_value ?? 0), 0);
  const pnl = totalValueThb - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  const chartData = priceHistories[activeCoin] ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/portfolio">
          <button className="h-9 w-9 rounded-lg border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{portfolio.name}</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">
            {portfolio.created_at
              ? `สร้างเมื่อ ${new Date(portfolio.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`
              : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCurrency("thb")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currency === "thb" ? "bg-[#00D4FF] text-black" : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845]"}`}
          >
            THB
          </button>
          <button
            onClick={() => setCurrency("usd")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${currency === "usd" ? "bg-[#00D4FF] text-black" : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845]"}`}
          >
            USD
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <p className="text-xs text-[#A0A0B0] mb-2">มูลค่าพอร์ตรวม</p>
          <p className="text-2xl font-bold text-white">
            {currency === "thb"
              ? `฿${totalValueThb.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
              : `$${totalValueUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
          </p>
        </div>
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <p className="text-xs text-[#A0A0B0] mb-2">ต้นทุนรวม</p>
          <p className="text-2xl font-bold text-white">
            ฿{totalCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <p className="text-xs text-[#A0A0B0] mb-2">กำไร/ขาดทุน</p>
          <p className={`text-2xl font-bold ${pnl >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
            {pnl >= 0 ? "+" : ""}฿{pnl.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs mt-1 ${pnl >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
            {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Holdings */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <h2 className="text-base font-semibold text-white mb-4">สินทรัพย์ที่ถือครอง</h2>
        <div className="space-y-3">
          {holdingValues.map((h) => (
            <div
              key={h.id}
              onClick={() => setActiveCoin(h.coin_id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                activeCoin === h.coin_id
                  ? "bg-[#0A1845] border border-[#162660]"
                  : "hover:bg-[#0A1845]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: COIN_COLORS[h.coin_id] ?? "#00D4FF" }}
                >
                  {COIN_LABELS[h.coin_id] ?? h.coin_id.toUpperCase().slice(0, 3)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white uppercase">{COIN_LABELS[h.coin_id] ?? h.coin_id}</p>
                  <p className="text-xs text-[#5A6A9A]">{h.amount.toFixed(8)} เหรียญ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {currency === "thb"
                    ? `฿${h.value_thb.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                    : `$${h.value_usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                </p>
                <p className={`text-xs flex items-center justify-end gap-0.5 ${h.change_24h >= 0 ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                  {h.change_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(h.change_24h).toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">
            ประวัติราคา — {COIN_LABELS[activeCoin] ?? activeCoin.toUpperCase()}
          </h2>
          <div className="flex gap-1">
            {holdings.map((h) => (
              <button
                key={h.coin_id}
                onClick={() => setActiveCoin(h.coin_id)}
                className={`h-7 px-3 rounded-md text-xs font-semibold transition-all`}
                style={
                  activeCoin === h.coin_id
                    ? { background: COIN_COLORS[h.coin_id] ?? "#00D4FF", color: "#fff" }
                    : { background: "transparent", color: "#5A6A9A", border: "1px solid #0F1F55" }
                }
              >
                {COIN_LABELS[h.coin_id] ?? h.coin_id}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center rounded-lg border border-[#0F1F55] bg-[#030B2A]">
            <TrendingUp className="h-10 w-10 text-[#0F1F55] mb-3" />
            <p className="text-sm text-[#5A6A9A]">ยังไม่มีประวัติราคา</p>
            <p className="text-xs text-[#5A6A9A] mt-1">ระบบจะบันทึกราคาทุกวัน 06:00 น.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COIN_COLORS[activeCoin] ?? "#00D4FF"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COIN_COLORS[activeCoin] ?? "#00D4FF"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0F1F55" />
              <XAxis dataKey="date" tick={{ fill: "#5A6A9A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#5A6A9A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
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
              <Area
                type="monotone"
                dataKey={currency === "thb" ? "price_thb" : "price_usd"}
                stroke={COIN_COLORS[activeCoin] ?? "#00D4FF"}
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Transactions */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <h2 className="text-base font-semibold text-white mb-4">ประวัติธุรกรรม</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-[#5A6A9A] text-center py-8">ยังไม่มีธุรกรรม</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#0A1845] transition-colors ${
                  i !== transactions.length - 1 ? "border-b border-[#0F1F55]/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.type === "buy" ? "bg-[#00E676]/10" : "bg-[#FF5252]/10"}`}>
                    {tx.type === "buy"
                      ? <TrendingUp className="h-4 w-4 text-[#00E676]" />
                      : <TrendingDown className="h-4 w-4 text-[#FF5252]" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {tx.type === "buy" ? "ซื้อ" : "ขาย"} {COIN_LABELS[tx.coin_id] ?? tx.coin_id.toUpperCase()}
                    </p>
                    <p className="text-xs text-[#5A6A9A]">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      {tx.note ? ` · ${tx.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.type === "buy" ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                    {tx.type === "buy" ? "+" : "-"}{Number(tx.amount).toFixed(8)}
                  </p>
                  <p className="text-xs text-[#A0A0B0]">
                    ฿{Number(tx.total_value ?? 0).toLocaleString("th-TH")} · @฿{Number(tx.price_per_unit ?? 0).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
