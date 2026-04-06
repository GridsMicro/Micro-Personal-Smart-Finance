"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Star, ChevronUp, ChevronDown } from "lucide-react";

interface CoinData {
  symbol: string;
  name: string;
  priceUSD: number;
  priceTHB: number;
  priceChange24h: number; // จาก API จริง
  volume24h: number; // จาก API จริง
  sparklineData: number[];
  logo: string;
}

const SUPPORTED_COINS = [
  { symbol: "BTC", name: "Bitcoin", logo: "/coins/BTC.svg" },
  { symbol: "ETH", name: "Ethereum", logo: "/coins/ETH.svg" },
  { symbol: "SOL", name: "Solana", logo: "/coins/SOL.svg" },
  { symbol: "USDT", name: "Tether", logo: "/coins/USDT.svg" },
  { symbol: "XRP", name: "XRP", logo: "/coins/XRP.svg" },
  { symbol: "DOGE", name: "Dogecoin", logo: "/coins/DOGE.svg" },
  { symbol: "ADA", name: "Cardano", logo: "/coins/ADA.svg" },
  { symbol: "USDC", name: "USD Coin", logo: "/coins/USDC.svg" },
  { symbol: "ORDI", name: "Ordinals", logo: "/coins/ORDI.svg" },
  { symbol: "MOODENG", name: "Moo Deng", logo: "/coins/MOODENG.png" },
  { symbol: "GOAT", name: "Goat", logo: "/coins/GOAT.png" },
  { symbol: "AVAX", name: "Avalanche", logo: "/coins/AVAX.png" },
  { symbol: "SATS", name: "Sats", logo: "/coins/SATS.png" },
  { symbol: "BNB", name: "BNB", logo: "/coins/BNB.svg" },
  { symbol: "DOT", name: "Polkadot", logo: "/coins/DOT.png" },
  { symbol: "NEAR", name: "NEAR", logo: "/coins/NEAR.png" },
  { symbol: "TRX", name: "TRON", logo: "/coins/TRX.svg" },
  { symbol: "LINK", name: "Chainlink", logo: "/coins/LINK.svg" },
  { symbol: "MATIC", name: "Polygon", logo: "/coins/MATIC.svg" },
];

// Sparkline chart component
function SparklineChart({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length === 0) return <div className="w-24 h-8" />;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 96;
    const y = 32 - ((val - min) / range) * 32;
    return `${x},${y}`;
  }).join(" ");
  
  return (
    <svg className="w-24 h-8" viewBox="0 0 96 32">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <linearGradient id={`gradient-${positive}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={positive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
        <stop offset="100%" stopColor={positive ? "#10b981" : "#ef4444"} stopOpacity="0" />
      </linearGradient>
      <polygon
        points={`0,32 ${points} 96,32`}
        fill={`url(#gradient-${positive})`}
      />
    </svg>
  );
}

function PriceChange({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`flex items-center gap-1 ${positive ? "text-green-500" : "text-red-500"}`}>
      {positive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      {positive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

export default function MarketPage() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof CoinData>("priceChange24h");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/ticker");
        const data = await res.json();
        console.log("[MARKET DEBUG] Volume data sample:", {
          BTC: data.binance24h?.BTC,
          MATIC: data.binance24h?.MATIC,
          firstFew: Object.entries(data.binance24h || {}).slice(0, 3),
        });
        console.log("[MARKET DEBUG] API Response:", {
          binance24h: Object.keys(data.binance24h || {}),
          coingecko24h: Object.keys(data.coingecko24h || {}),
          binance: Object.keys(data.binance || {}),
          bitkub: Object.keys(data.bitkub || {}),
          coingecko: Object.keys(data.coingecko || {}),
        });
        
        // Build coin data with REAL data from API
        const coinData: CoinData[] = SUPPORTED_COINS.map((coin) => {
          // Get real price data from multiple sources
          let priceTHB = data.binance[coin.symbol] || data.bitkub[coin.symbol] || data.coingecko[coin.symbol] || 0;
          
          // For coins not in our supported exchange pairs, try coingecko mapping
          if (!priceTHB && data.coingecko[coin.symbol]) {
            priceTHB = data.coingecko[coin.symbol];
          }
          
          const priceUSD = priceTHB > 0 ? priceTHB / (data.usdthb || 35) : 0;
          
          // Get REAL 24hr data from Binance (primary) or CoinGecko (fallback)
          const binance24h = data.binance24h?.[coin.symbol];
          const coingecko24h = data.coingecko24h?.[coin.symbol];
          
          // Use Binance 24h data first, fallback to CoinGecko
          let priceChange24h = binance24h?.priceChangePercent ?? coingecko24h?.priceChangePercent ?? 0;
          let volume24h = binance24h?.quoteVolume ?? 0;
          
          // Build sparkline from actual price change (linear trend)
          const sparklineData: number[] = [];
          if (priceUSD > 0) {
            const change = (priceChange24h / 100) * priceUSD;
            const startPrice = priceUSD - change;
            for (let i = 0; i < 7; i++) {
              sparklineData.push(startPrice + (change * (i / 6)));
            }
          } else {
            // Fallback to flat line if no price
            sparklineData.push(0, 0, 0, 0, 0, 0, 0);
          }
          
          return {
            symbol: coin.symbol,
            name: coin.name,
            priceUSD,
            priceTHB,
            priceChange24h,
            volume24h,
            sparklineData,
            logo: coin.logo,
          };
        });
        
        setCoins(coinData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch prices:", err);
        setLoading(false);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const sortedCoins = [...coins].sort((a, b) => {
    const aVal = a[sortField] as number;
    const bVal = b[sortField] as number;
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: keyof CoinData) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">กำลังโหลดข้อมูลตลาด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">ตลาดคริปโต</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← กลับไป Dashboard
          </Link>
        </div>
      </header>

      {/* Top Gainers & Losers */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 5 Gainers */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white">5 อันดับบวกสูงสุด (24 ชม.)</h3>
            </div>
            <div className="space-y-2">
              {coins
                .filter(c => c.priceChange24h > 0)
                .sort((a, b) => b.priceChange24h - a.priceChange24h)
                .slice(0, 5)
                .map((coin, index) => (
                  <div key={coin.symbol} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 w-6">{index + 1}</span>
                      <img src={coin.logo} alt={coin.name} className="w-6 h-6 rounded-full" />
                      <div>
                        <p className="font-medium text-white text-sm">{coin.name}</p>
                        <p className="text-xs text-slate-400">{coin.symbol}</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-medium">+{coin.priceChange24h.toFixed(2)}%</span>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Top 5 Losers */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white">5 อันดับลบสูงสุด (24 ชม.)</h3>
            </div>
            <div className="space-y-2">
              {coins
                .filter(c => c.priceChange24h < 0)
                .sort((a, b) => a.priceChange24h - b.priceChange24h)
                .slice(0, 5)
                .map((coin, index) => (
                  <div key={coin.symbol} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 w-6">{index + 1}</span>
                      <img src={coin.logo} alt={coin.name} className="w-6 h-6 rounded-full" />
                      <div>
                        <p className="font-medium text-white text-sm">{coin.name}</p>
                        <p className="text-xs text-slate-400">{coin.symbol}</p>
                      </div>
                    </div>
                    <span className="text-red-400 font-medium">{coin.priceChange24h.toFixed(2)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coin Table */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">เหรียญ</th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("priceUSD")}
                  >
                    ราคา {sortField === "priceUSD" && (sortDesc ? "↓" : "↑")}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("priceChange24h")}
                  >
                    24 ชม. {sortField === "priceChange24h" && (sortDesc ? "↓" : "↑")}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("volume24h")}
                  >
                    ปริมาณ 24 ชม. {sortField === "volume24h" && (sortDesc ? "↓" : "↑")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">7 วันล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedCoins.map((coin, index) => (
                  <tr key={coin.symbol} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 text-slate-400 text-sm">
                      <button 
                        onClick={() => toggleWatchlist(coin.symbol)}
                        className="hover:text-yellow-400 transition-colors"
                      >
                        <Star 
                          className={`w-4 h-4 ${watchlist.includes(coin.symbol) ? "fill-yellow-400 text-yellow-400" : ""}`} 
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={coin.logo} 
                          alt={coin.name} 
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/coins/BTC.svg";
                          }}
                        />
                        <div>
                          <p className="font-medium text-white">{coin.name}</p>
                          <p className="text-xs text-slate-400">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-medium text-white">
                        ${coin.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </p>
                      <p className="text-xs text-slate-400">
                        ฿{coin.priceTHB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <PriceChange value={coin.priceChange24h} />
                    </td>
                    <td className="px-4 py-4 text-right text-slate-400 text-sm">
                      ${(coin.volume24h / 1e9).toFixed(2)}B
                    </td>
                    <td className="px-4 py-4 text-right">
                      <SparklineChart 
                        data={coin.sparklineData} 
                        positive={coin.priceChange24h >= 0} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-4 text-center">
          แสดงข้อมูลจาก Binance TH, Bitkub, OKX และ CoinGecko • อัปเดตทุก 30 วินาที
        </p>
      </div>
    </div>
  );
}
