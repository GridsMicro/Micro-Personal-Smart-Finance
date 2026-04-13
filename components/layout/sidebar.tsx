"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Eye,
  Newspaper,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "พอร์ตการลงทุน", icon: Wallet },
  { href: "/market", label: "ตลาด", icon: TrendingUp },
  { href: "/watchlist", label: "วอตช์ลิสต์", icon: Eye },
  { href: "/news", label: "ข่าวสาร", icon: Newspaper },
  { href: "/notifications", label: "การแจ้งเตือน", icon: Bell },
];

const accountItems = [
  { href: "/profile", label: "โปรไฟล์", icon: Settings },
  { href: "/security", label: "ความปลอดภัย", icon: Lock },
  { href: "/support", label: "ช่วยเหลือ", icon: HelpCircle },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  return (
    <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-16 lg:z-40 lg:h-[calc(100vh-4rem)] lg:w-64 lg:flex-col border-r border-[#0F1F55] bg-[#0A0A0F]/95">
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {/* Main Nav */}
        <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-[#5A6A9A] uppercase tracking-wider">
          เมนูหลัก
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-gradient-to-r from-[#00D4FF]/15 to-[#7B61FF]/10 text-white border-l-2 border-[#00D4FF] pl-[10px]"
                  : "text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white"
              )}>
                <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-[#00D4FF]" : "text-[#5A6A9A]")} size={18} />
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* Account Nav */}
        <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-[#5A6A9A] uppercase tracking-wider">
          บัญชี
        </p>
        {accountItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-gradient-to-r from-[#00D4FF]/15 to-[#7B61FF]/10 text-white border-l-2 border-[#00D4FF] pl-[10px]"
                  : "text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white"
              )}>
                <Icon className={cn("shrink-0", isActive ? "text-[#00D4FF]" : "text-[#5A6A9A]")} size={18} />
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* Admin Nav */}
        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-[#5A6A9A] uppercase tracking-wider">
              ผู้ดูแลระบบ
            </p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-gradient-to-r from-[#7B61FF]/15 to-[#00D4FF]/10 text-white border-l-2 border-[#7B61FF] pl-[10px]"
                      : "text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white"
                  )}>
                    <Icon className={cn("shrink-0", isActive ? "text-[#7B61FF]" : "text-[#5A6A9A]")} size={18} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-[#0F1F55]">
        <div className="flex items-center gap-2 text-xs text-[#5A6A9A]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00E676] animate-pulse" />
          ระบบทำงานปกติ
        </div>
      </div>
    </aside>
  );
}
