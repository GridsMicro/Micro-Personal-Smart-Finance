"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Search, Star, Bell, RefreshCw, Package } from "lucide-react";
import Link from "next/link";

interface AssetWithPrice {
  id: string;
  symbol: string;
  name: string;
  type: string | null;
  is_active: boolean | null;
  image_url: string | null;
  price: {
    price_usd: string;
    price_thb: string | null;
    change_24h: string | null;
    last_updated: Date | null;
  } | null;
}

const tabs = [
  { id: "all", label: "ทั้งหมด" },
  { id: "crypto", label: "Crypto" },
];

export default function MarketClient({ initialAssets }: { initialAssets: AssetWithPrice[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [starred, setStarred] = useState<string[]>([]);

  const filtered = initialAssets.filter((a) => {
    const matchSearch =
      a.symbol.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "all" || a.type === activeTab;
    return matchSearch && matchTab;
  });

  const toggleStar = (id: string) =>
    setStarred((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ตลาด</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">
            {initialAssets.length} สินทรัพย์ในระบบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <button className="h-9 w-9 rounded-lg border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors flex items-center justify-center">
              <RefreshCw className="h-4 w-4" />
            </button>
          </Link>
          <button className="h-9 px-4 rounded-lg text-sm font-semibold border border-[#162660] text-white hover:bg-[#0A1845] transition-colors flex items-center gap-2">
            <Bell className="h-4 w-4" />
            ตั้งแจ้งเตือน
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6A9A]" />
        <input
          type="text"
          placeholder="ค้นหาสินทรัพย์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[#040E35] border border-[#0F1F55] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-8 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-[#0A1845] text-white" : "text-[#5A6A9A] hover:text-[#A0A0B0]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#0F1F55] text-xs font-semibold text-[#5A6A9A] uppercase tracking-wider">
          <div className="col-span-1" />
          <div className="col-span-5">สินทรัพย์</div>
          <div className="col-span-3 text-right">ราคา (USD)</div>
          <div className="col-span-3 text-right">24h</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-12 w-12 text-[#0F1F55] mx-auto mb-3" />
            <p className="text-sm text-[#5A6A9A]">
              {initialAssets.length === 0
                ? "ยังไม่มีสินทรัพย์ในระบบ — Admin สามารถเพิ่มได้ที่หน้า Admin"
                : "ไม่พบสินทรัพย์ที่ค้นหา"}
            </p>
          </div>
        ) : (
          filtered.map((asset, i) => {
            const priceUsd = asset.price ? Number(asset.price.price_usd) : null;
            const change = asset.price?.change_24h ? Number(asset.price.change_24h) : null;
            const isPositive = change !== null && change >= 0;

            return (
              <div
                key={asset.id}
                className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-[#0A1845]/50 transition-colors cursor-pointer ${
                  i !== filtered.length - 1 ? "border-b border-[#0F1F55]/50" : ""
                }`}
              >
                <div className="col-span-1">
                  <button
                    onClick={() => toggleStar(asset.id)}
                    className={`transition-colors ${
                      starred.includes(asset.id) ? "text-[#FFB74D]" : "text-[#162660] hover:text-[#FFB74D]"
                    }`}
                  >
                    <Star className="h-4 w-4" fill={starred.includes(asset.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  {asset.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.image_url} alt={asset.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {asset.symbol[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{asset.symbol}</p>
                    <p className="text-xs text-[#5A6A9A]">{asset.name}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right text-sm font-semibold text-white">
                  {priceUsd !== null ? `$${priceUsd.toLocaleString()}` : <span className="text-[#5A6A9A]">-</span>}
                </div>
                <div className="col-span-3 text-right">
                  {change !== null ? (
                    <span className={`inline-flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                      {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {Math.abs(change).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-[#5A6A9A] text-sm">-</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
