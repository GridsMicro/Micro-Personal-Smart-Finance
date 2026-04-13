import { getUserProfile } from "@/actions/user";
import { redirectIfNotAuth } from "@/app/proxy/auth";
import { User, Mail, Shield, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default async function ProfilePage() {
  await redirectIfNotAuth();
  const user = await getUserProfile();
  const initials = (user.name || user.email || "U")[0].toUpperCase();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">โปรไฟล์</h1>
        <p className="text-sm text-[#A0A0B0] mt-0.5">จัดการข้อมูลส่วนตัวและบัญชีของคุณ</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-5">
          {/* Avatar + Info */}
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.3)] shrink-0">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || ""} className="h-full w-full rounded-2xl object-cover" />
                ) : initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{user.name || "ผู้ใช้"}</h2>
                <p className="text-sm text-[#A0A0B0]">{user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#00D4FF] text-white">
                  <Shield className="h-2.5 w-2.5" />
                  {user.role}
                </span>
              </div>
            </div>

            <form className="space-y-4" action="/actions/user" method="POST">
              <input type="hidden" name="action" value="updateProfile" />
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ชื่อ</label>
                <Input name="name" defaultValue={user.name || ""} placeholder="ชื่อของคุณ" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">อีเมล</label>
                <Input value={user.email} disabled className="opacity-50 cursor-not-allowed" />
                <p className="text-xs text-[#5A6A9A] mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
              </div>
              <button type="submit" className="h-10 px-5 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
                บันทึกการเปลี่ยนแปลง
              </button>
            </form>
          </div>

          {/* Account Stats */}
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">สถิติบัญชี</h3>
            <div className="space-y-1">
              {[
                {
                  label: "สมัครสมาชิกเมื่อ",
                  value: user.created_at
                    ? new Date(user.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
                    : "-",
                  icon: Calendar,
                },
                {
                  label: "สถานะบัญชี",
                  value: user.is_active ? "ใช้งานได้" : "ถูกระงับ",
                  icon: CheckCircle,
                  valueColor: user.is_active ? "#00E676" : "#FF5252",
                },
                {
                  label: "ยืนยันอีเมล",
                  value: user.email_verified ? "ยืนยันแล้ว" : "รอยืนยัน",
                  icon: Mail,
                  valueColor: user.email_verified ? "#00E676" : "#FFB74D",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#0A1845] transition-colors">
                    <div className="flex items-center gap-2.5 text-sm text-[#A0A0B0]">
                      <Icon className="h-4 w-4 text-[#5A6A9A]" />
                      {item.label}
                    </div>
                    <span className="text-sm font-medium" style={{ color: item.valueColor || "#FFFFFF" }}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">เมนูลัด</h3>
            <div className="space-y-1.5">
              {[
                { href: "/settings", label: "ตั้งค่าบัญชี", icon: User },
                { href: "/security", label: "ความปลอดภัย", icon: Shield },
                ...(user.role === "admin" || user.role === "superadmin"
                  ? [{ href: "/admin", label: "Admin Panel", icon: Shield }]
                  : []),
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
