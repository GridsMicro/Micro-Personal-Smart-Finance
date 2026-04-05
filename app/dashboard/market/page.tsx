"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Star, ArrowUpDown, Search } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import Navbar from "../../components/Navbar";

// 16 Coins as specified
const COINS = [
  { rank: 1, symbol: "THB", name: "Thai Baht", type: "FIAT", supply: "N/A" },
  { rank: 2, symbol: "USDT", name: "Tether", type: "STABLE", supply: "142.5B" },
  { rank: 3, symbol: "BTC", name: "Bitcoin", type: "CRYPTO", supply: "19.8M" },
  { rank: 4, symbol: "ETH", name: "Ethereum", type: "CRYPTO", supply: "120.5M" },
  { rank: 5, symbol: "SOL", name: "Solana", type: "CRYPTO", supply: "486.2M" },
  { rank: 6, symbol: "BNB", name: "BNB", type: "CRYPTO", supply: "144.9M" },
  { rank: 7, symbol: "AVAX", name: "Avalanche", type: "CRYPTO", supply: "408.9M" },
  { rank: 8, symbol: "NEAR", name: "NEAR Protocol", type: "CRYPTO", supply: "1.1B" },
  { rank: 9, symbol: "DOT", name: "Polkadot", type: "CRYPTO", supply: "1.5B" },
  { rank: 10, symbol: "TRX", name: "TRON", type: "CRYPTO", supply: "86.3B" },
  { rank: 11, symbol: "XRP", name: "XRP", type: "CRYPTO", supply: "58.1B" },
  { rank: 12, symbol: "LINK", name: "Chainlink", type: "CRYPTO", supply: "631.1M" },
  { rank: 13, symbol: "ORDI", name: "Ordinals", type: "CRYPTO", supply: "21M" },
  { rank: 14, symbol: "MOODENG", name: "Moo Deng", type: "MEME", supply: "420.69B" },
  { rank: 15, symbol: "SATS", name: "SATS", type: "MEME", supply: "2.1Q" },
  { rank: 16, symbol: "GOAT", name: "GOAT", type: "MEME", supply: "1B" },
];

interface CoinData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  sparkline: { value: number }[];
}

// Mock data generator for demo (will be replaced with real API)
function generateMockData(symbol: string): CoinData {
  const basePrices: Record<string, number> = {
    THB: 1,
    USDT: 35.5,
    BTC: 2400000,
    ETH: 78000,
    SOL: 5600,
    BNB: 18000,
    AVAX: 1200,
    NEAR: 250,
    DOT: 380,
    TRX: 4.2,
    XRP: 18,
    LINK: 280,
    ORDI: 1200,
    MOODENG: 0.15,
    SATS: 0.0001,
    GOAT: 12,
  };

  const basePrice = basePrices[symbol] || 100;
  const volatility = symbol === "BTC" || symbol === "ETH" ? 0.05 : 0.1;

  // Generate 7-day sparkline data
  const sparkline = [];
  let currentPrice = basePrice;
  for (let i = 0; i < 7; i++) {
    currentPrice = currentPrice * (1 + (Math.random() - 0.5) * volatility);
    sparkline.push({ value: currentPrice });
  }

  const price = sparkline[sparkline.length - 1].value;
  const priceChange24h = (Math.random() - 0.5) * 20;
  const priceChange7d = ((price - sparkline[0].value) / sparkline[0].value) * 100;

  return {
    symbol,
    price,
    priceChange24h,
    priceChange7d,
    marketCap: price * (Math.random() * 1000000000 + 1000000),
    volume24h: price * (Math.random() * 100000000 + 1000000),
    sparkline,
  };
}

function SparklineChart({ data, positive }: { data: { value: number }[]; positive: boolean }) {
  const color = positive ? "#16a34a" : "#dc2626";

  return (
    <div className="w-24 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else if (price >= 1000) {
    return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toLocaleString("en-US", { maximumFractionDigits: 4 });
  } else {
    return price.toLocaleString("en-US", { maximumFractionDigits: 6 });
  }
}

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}

export default function MarketPage() {
  const [coinData, setCoinData] = useState<Record<string, CoinData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"rank" | "price" | "change24h" | "change7d" | "marketCap" | "volume">("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    // In real implementation, fetch from your API
    const data: Record<string, CoinData> = {};
    COINS.forEach((coin) => {
      data[coin.symbol] = generateMockData(coin.symbol);
    });
    setCoinData(data);
  }, []);

  const filteredCoins = useMemo(() => {
    let filtered = COINS.filter(
      (coin) =>
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "rank":
          comparison = a.rank - b.rank;
          break;
        case "price":
          comparison = (coinData[a.symbol]?.price || 0) - (coinData[b.symbol]?.price || 0);
          break;
        case "change24h":
          comparison = (coinData[a.symbol]?.priceChange24h || 0) - (coinData[b.symbol]?.priceChange24h || 0);
          break;
        case "change7d":
          comparison = (coinData[a.symbol]?.priceChange7d || 0) - (coinData[b.symbol]?.priceChange7d || 0);
          break;
        case "marketCap":
          comparison = (coinData[a.symbol]?.marketCap || 0) - (coinData[b.symbol]?.marketCap || 0);
          break;
        case "volume":
          comparison = (coinData[a.symbol]?.volume24h || 0) - (coinData[b.symbol]?.volume24h || 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, sortField, sortDirection, coinData]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const totalMarketCap = Object.values(coinData).reduce((sum, coin) => sum + coin.marketCap, 0);
  const totalVolume = Object.values(coinData).reduce((sum, coin) => sum + coin.volume24h, 0);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header Stats */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Today's Cryptocurrency Prices</h1>
            <span className="text-sm text-slate-500">by Market Cap</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Market Cap</p>
              <p className="text-xl font-bold text-slate-900">฿{formatNumber(totalMarketCap)}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +2.4%
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">24h Volume</p>
              <p className="text-xl font-bold text-slate-900">฿{formatNumber(totalVolume)}</p>
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" /> -5.2%
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Active Coins</p>
              <p className="text-xl font-bold text-slate-900">16</p>
              <p className="text-xs text-slate-400 mt-1">Tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search coin name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl
                         text-slate-900 placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                  <button
                    onClick={() => handleSort("rank")}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    # {sortField === "rank" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Coin
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("price")}
                    className="flex items-center gap-1 ml-auto hover:text-slate-700"
                  >
                    Price {sortField === "price" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("change24h")}
                    className="flex items-center gap-1 ml-auto hover:text-slate-700"
                  >
                    24h % {sortField === "change24h" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  <button
                    onClick={() => handleSort("change7d")}
                    className="flex items-center gap-1 ml-auto hover:text-slate-700"
                  >
                    7d % {sortField === "change7d" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  <button
                    onClick={() => handleSort("marketCap")}
                    className="flex items-center gap-1 ml-auto hover:text-slate-700"
                  >
                    Market Cap {sortField === "marketCap" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  <button
                    onClick={() => handleSort("volume")}
                    className="flex items-center gap-1 ml-auto hover:text-slate-700"
                  >
                    Volume(24h) {sortField === "volume" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                  Supply
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                  Last 7 Days
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoins.map((coin) => {
                const data = coinData[coin.symbol];
                if (!data) return null;

                const isPositive24h = data.priceChange24h >= 0;
                const isPositive7d = data.priceChange7d >= 0;

                return (
                  <tr
                    key={coin.symbol}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-slate-300 hover:text-yellow-400 transition-colors">
                          <Star className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-slate-500">{coin.rank}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/admin/coins/${coin.symbol.toLowerCase()}`}
                        className="flex items-center gap-3 group-hover:opacity-80 transition-opacity"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600
                                      flex items-center justify-center text-white text-xs font-bold">
                          {coin.symbol[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{coin.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            {coin.symbol}
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                              {coin.type}
                            </span>
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-semibold text-slate-900">
                        ฿{formatPrice(data.price)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className={`font-medium flex items-center justify-end gap-1 ${isPositive24h ? "text-green-600" : "text-red-600"}`}>
                        {isPositive24h ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(data.priceChange24h).toFixed(2)}%
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right hidden md:table-cell">
                      <p className={`font-medium ${isPositive7d ? "text-green-600" : "text-red-600"}`}>
                        {isPositive7d ? "+" : ""}{data.priceChange7d.toFixed(2)}%
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right hidden lg:table-cell">
                      <p className="text-slate-900 font-medium">
                        ฿{formatNumber(data.marketCap)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right hidden lg:table-cell">
                      <p className="text-slate-900 font-medium">
                        ฿{formatNumber(data.volume24h)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right hidden xl:table-cell">
                      <p className="text-slate-600 text-sm">{coin.supply}</p>
                    </td>
                    <td className="px-4 py-4">
                      <SparklineChart data={data.sparkline} positive={isPositive7d} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Showing {filteredCoins.length} of {COINS.length} coins
        </div>
      </div>
    </div>
  );
}
