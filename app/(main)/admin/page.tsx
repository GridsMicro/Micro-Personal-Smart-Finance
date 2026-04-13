import { redirectIfNotAuth } from "@/app/proxy/auth";
import { getAdminDashboard } from "@/actions/admin";
import { Users, Activity, BarChart3, Shield, Settings, FileText, Wallet, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  await redirectIfNotAuth();
  const data = await getAdminDashboard();

  const stats = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: data.totalUsers.toLocaleString(),
      sub: `${data.activeUsers} ใช้งานอยู่`,
      icon: Users,
      iconColor: "#00D4FF",
      iconBg: "rgba(0,212,255,0.1)",
    },
    {
      title: "พอร์ตทั้งหมด",
      value: data.totalPortfolios.toLocaleString(),
      sub: "พอร์ตการลงทุน",
      icon: Wallet,
      iconColor: "#00E676",
      iconBg: "rgba(0,230,118,0.1)",
    },
    {
      title: "ธุรกรรมทั้งหมด",
      value: data.totalTransactions.toLocaleString(),
      sub: "Buy/Sell transactions",
      icon: Activity,
      iconColor: "#7B61FF",
      iconBg: "rgba(123,97,255,0.1)",
    },
    {
      title: "Support Tickets",
      value: data.totalTickets.toLocaleString(),
      sub: "คำขอช่วยเหลือ",
      icon: MessageSquare,
      iconColor: "#FFB74D",
      iconBg: "rgba(255,183,77,0.1)",
    },
  ];

  const tabs = [
    { id: "dashboard", label: "ภาพรวม", icon: BarChart3 },
    { id: "users", label: "ผู้ใช้", icon: Users },
    { id: "system", label: "ระบบ", icon: Activity },
    { id: "settings", label: "ตั้งค่า", icon: Settings },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">จัดการระบบและผู้ใช้</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00E676]/10 border border-[#00E676]/20">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00E676] animate-pulse" />
          <span className="text-xs font-medium text-[#00E676]">System Online</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5 transition-all hover:border-[#162660]">
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

      {/* Recent Users */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <h2 className="text-base font-semibold text-white mb-5">ผู้ใช้ล่าสุด</h2>
        {data.recentUsers.length === 0 ? (
          <p className="text-sm text-[#5A6A9A] text-center py-8">ยังไม่มีผู้ใช้</p>
        ) : (
          <div className="space-y-1">
            {data.recentUsers.map((user, i) => (
              <div
                key={user.id}
                className={`flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#0A1845] transition-colors ${i !== data.recentUsers.length - 1 ? "border-b border-[#0F1F55]/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name || "ไม่มีชื่อ"}</p>
                    <p className="text-xs text-[#5A6A9A]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Role badge */}
                  {user.role !== "user" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] text-white">
                      {user.role}
                    </span>
                  )}
                  {/* Status badge */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.is_active ? "bg-[#00E676]/10 text-[#00E676]" : "bg-[#FF5252]/10 text-[#FF5252]"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-[#5A6A9A] hidden sm:block">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tools */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "จัดการผู้ใช้", desc: "ดู/แก้ไข role และสถานะ", icon: Users, color: "#00D4FF", href: "/admin" },
          { label: "จัดการข่าวสาร", desc: "เพิ่ม/ลบบทความข่าว", icon: FileText, color: "#7B61FF", href: "/admin/news" },
          { label: "จัดการสินทรัพย์", desc: "เพิ่ม/ลบ coins และ assets", icon: MessageSquare, color: "#00E676", href: "/admin/assets" },
          { label: "จัดการ API", desc: "ดึงราคา real-time, cron job", icon: Settings, color: "#FFB74D", href: "/admin/api-keys" },
          { label: "Support Tickets", desc: "ดูและตอบกลับ tickets", icon: MessageSquare, color: "#FF5252", href: "/support" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5 hover:border-[#162660] transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                    <Icon className="h-4.5 w-4.5" style={{ color: item.color }} size={18} />
                  </div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                </div>
                <p className="text-xs text-[#5A6A9A]">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
