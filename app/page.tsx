import Link from "next/link";
import { TrendingUp, Wallet, PieChart, Bell, Shield, Zap, ArrowRight, BarChart3, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#0F1F55] bg-[#0A0A0F]/95 backdrop-blur-[12px]">
        <div className="flex h-full items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.4)]">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">Micro Finance</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features" className="hidden sm:block text-sm text-[#A0A0B0] hover:text-white transition-colors">
              ฟีเจอร์
            </Link>
            <Link href="/login">
              <button className="h-9 px-4 rounded-lg text-sm font-semibold bg-transparent border border-[#162660] text-white hover:bg-[#0A1845] transition-colors">
                เข้าสู่ระบบ
              </button>
            </Link>
            <Link href="/login">
              <button className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
                เริ่มต้นใช้งาน
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.12)_0%,rgba(123,97,255,0.08)_40%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0F1F55] bg-[#040E35] text-xs text-[#A0A0B0] mb-8">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00E676] animate-pulse" />
            ระบบพร้อมใช้งาน · Real-time Data
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            บริหารพอร์ต
            <br />
            <span className="gradient-text">อย่างมืออาชีพ</span>
          </h1>

          <p className="text-lg text-[#A0A0B0] max-w-2xl mx-auto mb-10 leading-relaxed">
            ระบบติดตามและวิเคราะห์พอร์ตการลงทุนส่วนบุคคลครบวงจร
            รองรับ Crypto, หุ้น และสินทรัพย์ดิจิทัล พร้อมข้อมูล Real-time
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/login">
              <button className="h-12 px-8 rounded-lg text-base font-semibold bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] text-white hover:opacity-90 shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2">
                เริ่มต้นฟรี
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="#features">
              <button className="h-12 px-8 rounded-lg text-base font-semibold bg-transparent border border-[#162660] text-white hover:bg-[#0A1845] transition-colors">
                ดูฟีเจอร์
              </button>
            </Link>
            <Link href="/p/a0000000-0000-0000-0000-000000000001">
              <button className="h-12 px-8 rounded-lg text-base font-semibold bg-transparent border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors flex items-center gap-2">
                ดูพอร์ตตัวอย่าง
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "Real-time", label: "ราคาสด" },
              { value: "12+", label: "ประเภทสินทรัพย์" },
              { value: "100%", label: "ปลอดภัย" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-[#00D4FF]">{stat.value}</div>
                <div className="text-xs text-[#6B6B7B] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">ฟีเจอร์ครบครัน</h2>
            <p className="text-[#A0A0B0] max-w-xl mx-auto">
              ทุกเครื่องมือที่นักลงทุนต้องการ ในที่เดียว
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Wallet className="h-6 w-6 text-[#00D4FF]" />,
                iconBg: "rgba(0,212,255,0.1)",
                title: "จัดการพอร์ต",
                desc: "สร้างและจัดการพอร์ตหลายบัญชี ติดตามผลประกอบการแบบ Real-time พร้อมประวัติธุรกรรมครบถ้วน",
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-[#00E676]" />,
                iconBg: "rgba(0,230,118,0.1)",
                title: "ติดตามราคา",
                desc: "ราคา Crypto, หุ้น, พลังงาน และดัชนีเศรษฐกิจ อัปเดตแบบ Real-time จากตลาดทั่วโลก",
              },
              {
                icon: <PieChart className="h-6 w-6 text-[#7B61FF]" />,
                iconBg: "rgba(123,97,255,0.1)",
                title: "วิเคราะห์พอร์ต",
                desc: "กราฟและรายงานวิเคราะห์เชิงลึก ดูสัดส่วนการลงทุน กำไร/ขาดทุน และแนวโน้ม",
              },
              {
                icon: <Bell className="h-6 w-6 text-[#FFB74D]" />,
                iconBg: "rgba(255,183,77,0.1)",
                title: "แจ้งเตือนอัจฉริยะ",
                desc: "ตั้งค่าแจ้งเตือนราคาถึงเป้าหมาย รับข่าวสารสำคัญ และการแจ้งเตือนจากระบบทันที",
              },
              {
                icon: <Shield className="h-6 w-6 text-[#4FC3F7]" />,
                iconBg: "rgba(79,195,247,0.1)",
                title: "ความปลอดภัยสูง",
                desc: "OAuth 2.0 ผ่าน Google และ GitHub ระบบเข้ารหัสข้อมูล พร้อมประวัติการเข้าสู่ระบบ",
              },
              {
                icon: <Zap className="h-6 w-6 text-[#00D4FF]" />,
                iconBg: "rgba(0,212,255,0.1)",
                title: "เร็วและลื่นไหล",
                desc: "Next.js 15 + React 19 ประสบการณ์ใช้งานที่รวดเร็ว ไม่มีการโหลดที่น่ารำคาญ",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 transition-all duration-300 hover:border-[#162660] hover:shadow-[0_10px_15px_rgba(0,0,0,0.5)] group"
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: f.iconBg }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#A0A0B0] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
              <p className="text-[#A0A0B0] mb-8">สมัครฟรี ไม่มีค่าใช้จ่าย เริ่มติดตามพอร์ตได้ทันที</p>
              <Link href="/login">
                <button className="h-12 px-10 rounded-lg text-base font-semibold bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] text-white hover:opacity-90 shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all inline-flex items-center gap-2">
                  เริ่มต้นฟรี
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0F1F55] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">M</span>
            </div>
            <span className="text-sm font-semibold text-white">Micro Finance</span>
          </div>
          <p className="text-xs text-[#6B6B7B]">
            © 2026 Microtronic Co., Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-[#6B6B7B]">
            <Globe className="h-3 w-3" />
            microtronic.biz
          </div>
        </div>
      </footer>
    </div>
  );
}
