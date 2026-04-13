import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, PieChart, Plus, RefreshCw, ArrowUpRight, LayoutDashboard } from "lucide-react";
import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getDashboardData } from "@/actions/dashboard";

export default async function DashboardPage() {
  await redirectIfNotAuth();
  const data = await getDashboardData();

  const stats = [
    {
      title: "พอร์ตการลงทุน",
      value: data.portfolioCount.toString(),
      sub: data.portfolioCount > 0 ? `${data.portfolios[0].name}` : "ยังไม่มีพอร์ต",
      icon: Wallet,
      iconColor: "#00D4FF",
      iconBg: "rgba(0,212,255,0.1)",
    },
    {
      title: "สินทรัพย์ในพอร์ต",
      value: data.assetCount.toString(),
      sub: "รายการ",
      icon: PieChart,
      iconColor: "#7B61FF",
      iconBg: "rgba(123,97,255,0.1)",
    },
    {
      title: "ธุรกรรมทั้งหมด",
      value: data.recentTransactions.length.toString(),
      sub: "รายการล่าสุด",
      icon: TrendingUp,
      iconColor: "#00E676",
      iconBg: "rgba(0,230,118,0.1)",
    },
    {
      title: "สถานะ",
      value: data.portfolioCount > 0 ? "Active" : "ยังไม่มีพอร์ต",
      sub: data.portfolioCount > 0 ? "พอร์ตพร้อมใช้งาน" : "สร้างพอร์ตแรกได้เลย",
      icon: LayoutDashboard,
      iconColor: "#FFB74D",
      iconBg: "rgba(255,183,77,0.1)",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">ภาพรวมพอร์ตการลงทุนของคุณ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <button className="h-9 w-9 rounded-lg border border-[#0F1F55] bg-transparent text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors flex items-center justify-center">
              <RefreshCw className="h-4 w-4" />
            </button>
          </Link>
          <Link href="/portfolio">
            <button className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มพอร์ต
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5 transition-all duration-300 hover:border-[#162660]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[#A0A0B0]">{stat.title}</p>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: stat.iconBg }}>
                  <Icon className="h-4 w-4" style={{ color: stat.iconColor }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <p className="text-xs text-[#A0A0B0]">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Portfolios + Recent Transactions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Portfolios */}
        <div className="lg:col-span-1 rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">พอร์ตของฉัน</h2>
            <Link href="/portfolio" className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1">
              จัดการ <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {data.portfolios.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-10 w-10 text-[#0F1F55] mx-auto mb-3" />
              <p className="text-sm text-[#5A6A9A] mb-4">ยังไม่มีพอร์ต</p>
              <Link href="/portfolio">
                <button className="h-8 px-4 rounded-lg text-xs font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] transition-all">
                  สร้างพอร์ตแรก
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.portfolios.map((p) => (
                <Link key={p.id} href={`/portfolio`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0A1845] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-[#5A6A9A]">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString("th-TH") : "-"}
                        </p>
                      </div>
                    </div>
                    {p.is_default && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D4FF]/10 text-[#00D4FF]">
                        หลัก
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">ธุรกรรมล่าสุด</h2>
            <Link href="/portfolio" className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-10 w-10 text-[#0F1F55] mx-auto mb-3" />
              <p className="text-sm text-[#5A6A9A] mb-4">ยังไม่มีธุรกรรม</p>
              <Link href="/portfolio">
                <button className="h-8 px-4 rounded-lg text-xs font-semibold border border-[#0F1F55] text-white hover:bg-[#0A1845] transition-colors">
                  เพิ่มธุรกรรมแรก
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0A1845] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.type === "buy" ? "bg-[#00E676]/10" : "bg-[#FF5252]/10"}`}>
                      {tx.type === "buy"
                        ? <TrendingUp className="h-4 w-4 text-[#00E676]" />
                        : <TrendingDown className="h-4 w-4 text-[#FF5252]" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{tx.type} {tx.coin_id}</p>
                      <p className="text-xs text-[#5A6A9A]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString("th-TH") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "buy" ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                      {tx.type === "buy" ? "+" : "-"}{tx.amount} {tx.coin_id}
                    </p>
                    <p className="text-xs text-[#A0A0B0]">
                      {tx.total_value ? `$${Number(tx.total_value).toLocaleString()}` : tx.currency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <h2 className="text-base font-semibold text-white mb-4">เมนูด่วน</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/portfolio", label: "จัดการพอร์ต", icon: Wallet, color: "#00D4FF" },
            { href: "/market", label: "ดูตลาด", icon: TrendingUp, color: "#00E676" },
            { href: "/watchlist", label: "วอตช์ลิสต์", icon: PieChart, color: "#7B61FF" },
            { href: "/news", label: "ข่าวสาร", icon: LayoutDashboard, color: "#FFB74D" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#0F1F55] hover:bg-[#0A1845] hover:border-[#162660] transition-all cursor-pointer">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                  <span className="text-sm text-white">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
