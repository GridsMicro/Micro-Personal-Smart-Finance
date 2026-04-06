"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Coins, Users, Settings, Activity, Database, Shield, 
  ChevronRight, TrendingUp, AlertTriangle, CheckCircle 
} from "lucide-react";

interface AdminStats {
  totalCoins: number;
  totalUsers: number;
  totalTransactions: number;
  apiStatus: Record<string, boolean>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalCoins: 0,
    totalUsers: 0,
    totalTransactions: 0,
    apiStatus: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch stats from various endpoints
        const [coinsRes, tickerRes, adminStatsRes] = await Promise.all([
          fetch("/api/coins").catch(() => null),
          fetch("/api/ticker").catch(() => null),
          fetch("/api/admin/stats").catch(() => null)
        ]);

        const coins = coinsRes ? await coinsRes.json().catch(() => ({ coins: [] })) : { coins: [] };
        const ticker = tickerRes ? await tickerRes.json().catch(() => ({})) : {};
        const adminStats = adminStatsRes ? await adminStatsRes.json().catch(() => ({ stats: {} })) : { stats: {} };

        setStats({
          totalCoins: coins.coins?.length || 19,
          totalUsers: adminStats.stats?.totalUsers || 0,
          totalTransactions: adminStats.stats?.totalTransactions || 0,
          apiStatus: {
            binance: !!ticker.binance,
            bitkub: !!ticker.bitkub,
            okx: !!ticker.okx,
            coingecko: !!ticker.coingecko
          }
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminMenus = [
    {
      title: "จัดการเหรียญ",
      description: "เพิ่ม/แก้ไข/ลบเหรียญในระบบ",
      icon: Coins,
      href: "/dashboard/admin/coins",
      color: "bg-blue-500",
      count: stats.totalCoins
    },
    {
      title: "ผู้ใช้งาน",
      description: "จัดการผู้ใช้งานและสิทธิ์",
      icon: Users,
      href: "/dashboard/admin/users",
      color: "bg-green-500",
      count: stats.totalUsers
    },
    {
      title: "ธุรกรรม",
      description: "ดูประวัติและจัดการธุรกรรม",
      icon: Database,
      href: "/dashboard/admin/transactions",
      color: "bg-purple-500",
      count: stats.totalTransactions
    },
    {
      title: "สถานะ API",
      description: "ตรวจสอบสถานะการเชื่อมต่อ API",
      icon: Activity,
      href: "/tools/api-test",
      color: "bg-orange-500",
      count: Object.values(stats.apiStatus).filter(Boolean).length
    },
    {
      title: "ตั้งค่าระบบ",
      description: "ตั้งค่าและการตั้งค่าขั้นสูง",
      icon: Settings,
      href: "/dashboard/admin/settings",
      color: "bg-slate-500",
      count: null
    },
    {
      title: "ความปลอดภัย",
      description: "จัดการการเข้าถึงและความปลอดภัย",
      icon: Shield,
      href: "/dashboard/admin/security",
      color: "bg-red-500",
      count: null
    }
  ];

  const apiProviders = [
    { name: "Binance TH", key: "binance", status: stats.apiStatus.binance },
    { name: "Bitkub", key: "bitkub", status: stats.apiStatus.bitkub },
    { name: "OKX", key: "okx", status: stats.apiStatus.okx },
    { name: "CoinGecko", key: "coingecko", status: stats.apiStatus.coingecko }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center">
        <div className="text-neon-cyan font-mono animate-pulse">LOADING ADMIN DASHBOARD...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">
                ADMIN <span className="text-neon-cyan">PANEL</span>
              </h1>
              <p className="text-sm text-slate-500">จัดการระบบและตั้งค่า</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">SuperAdmin Mode</span>
              </div>
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                กลับไป Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-400">เหรียญทั้งหมด</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalCoins}</p>
          </div>
          <div className="p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="text-sm text-slate-400">ผู้ใช้งาน</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsers || "-"}</p>
          </div>
          <div className="p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-400">ธุรกรรม</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalTransactions || "-"}</p>
          </div>
          <div className="p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-slate-400">API Online</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Object.values(stats.apiStatus).filter(Boolean).length}/{Object.keys(stats.apiStatus).length}
            </p>
          </div>
        </div>

        {/* API Status */}
        <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-cyan" />
            สถานะ API
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {apiProviders.map((api) => (
              <div 
                key={api.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  api.status 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <span className="text-sm font-medium">{api.name}</span>
                <div className={`w-2 h-2 rounded-full ${api.status ? "bg-green-500" : "bg-red-500"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Admin Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <Link
                key={menu.title}
                href={menu.href}
                className="group p-6 bg-slate-900/80 border border-slate-700 rounded-xl hover:border-neon-cyan/50 hover:bg-slate-800/80 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${menu.color} bg-opacity-20 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${menu.color.replace("bg-", "text-")}`} />
                  </div>
                  {menu.count !== null && (
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-sm font-medium">
                      {menu.count}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{menu.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{menu.description}</p>
                <div className="flex items-center text-neon-cyan text-sm group-hover:translate-x-1 transition-transform">
                  <span>จัดการ</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Warning Section */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-yellow-500 mb-1">คำเตือน</h4>
            <p className="text-sm text-yellow-500/80">
              การเปลี่ยนแปลงใน Admin Panel อาจส่งผลกระทบต่อระบบทั้งหมด กรุณาตรวจสอบความถูกต้องก่อนบันทึก
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
