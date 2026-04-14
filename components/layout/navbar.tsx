"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Bell, Menu, User, LogOut, Settings, ChevronDown, Shield, BarChart2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#0F1F55] bg-[#0A0A0F]/95 backdrop-blur-[12px]">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.4)]">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-white hidden sm:inline text-[15px] tracking-tight">
              Micro Finance
            </span>
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Special Port Link */}
          <Link href="/p/a0000000-0000-0000-0000-000000000001">
            <button className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors">
              <BarChart2 className="h-3.5 w-3.5" />
              Special Port
            </button>
          </Link>

          {/* Special Port Link */}
          <Link href="/admin/special-port">
            <button className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors">
              <BarChart2 className="h-3.5 w-3.5" />
              Special Port Editor
            </button>
          </Link>
          
          {/* DCA Simulation */}
          <Link href="/dca-simulation">
            <button className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-[#7B61FF]/30 text-[#7B61FF] hover:bg-[#7B61FF]/10 transition-colors">
              <BarChart2 className="h-3.5 w-3.5" />
              DCA Simulation
            </button>
          </Link>

          {/* Notifications */}
          <Link href="/notifications">
            <button className="relative flex items-center justify-center h-9 w-9 rounded-lg text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF5252] shadow-[0_0_6px_rgba(255,82,82,0.6)]" />
            </button>
          </Link>

          {/* User Menu */}
          {session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 h-9 px-3 rounded-lg text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate text-white">
                  {session.user.name || session.user.email}
                </span>
                {isAdmin && (
                  <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] text-white">
                    <Shield className="h-2.5 w-2.5" />
                    Admin
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#0F1F55] bg-[#040E35] shadow-[0_10px_15px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-[#0F1F55]">
                    <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
                    <p className="text-xs text-[#5A6A9A] truncate">{session.user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link href="/profile" onClick={() => setIsUserMenuOpen(false)}>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors cursor-pointer">
                        <User className="h-4 w-4" />
                        โปรไฟล์
                      </div>
                    </Link>
                    <Link href="/settings" onClick={() => setIsUserMenuOpen(false)}>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors cursor-pointer">
                        <Settings className="h-4 w-4" />
                        ตั้งค่า
                      </div>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsUserMenuOpen(false)}>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors cursor-pointer">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </div>
                      </Link>
                    )}
                  </div>
                  <div className="p-1.5 border-t border-[#0F1F55]">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-[#FF5252] hover:bg-[#FF5252]/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">เริ่มต้นใช้งาน</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="lg:hidden border-t border-[#0F1F55] bg-[#0A0A0F] p-3 animate-fade-in">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/portfolio", label: "พอร์ตการลงทุน" },
            { href: "/market", label: "ตลาด" },
            { href: "/watchlist", label: "วอตช์ลิสต์" },
            { href: "/news", label: "ข่าวสาร" },
            { href: "/dca-simulation", label: "DCA Simulation" },
            { href: "/support", label: "ช่วยเหลือ" },
            { href: "/settings", label: "ตั้งค่า" },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div className="px-3 py-2.5 rounded-lg text-sm text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors">
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
