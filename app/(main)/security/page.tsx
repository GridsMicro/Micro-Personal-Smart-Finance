import { getLoginHistory } from "@/actions/security";
import { redirectIfNotAuth } from "@/app/proxy/auth";
import { Key, Smartphone, History, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function SecurityPage() {
  await redirectIfNotAuth();

  const loginHistory = await getLoginHistory(10);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">ความปลอดภัย</h1>
        <p className="text-sm text-[#A0A0B0] mt-0.5">จัดการรหัสผ่านและการเข้าถึงบัญชี</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Change Password */}
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-9 w-9 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center">
              <Key className="h-4.5 w-4.5 text-[#00D4FF]" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">เปลี่ยนรหัสผ่าน</h2>
              <p className="text-xs text-[#5A6A9A]">ควรเปลี่ยนทุก 3-6 เดือน</p>
            </div>
          </div>
          <form className="space-y-3" action="/actions/security" method="POST">
            <input type="hidden" name="action" value="changePassword" />
            <div>
              <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">รหัสผ่านปัจจุบัน</label>
              <Input type="password" name="currentPassword" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">รหัสผ่านใหม่</label>
              <Input type="password" name="newPassword" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ยืนยันรหัสผ่านใหม่</label>
              <Input type="password" name="confirmPassword" placeholder="••••••••" />
            </div>
            <button type="submit" className="mt-2 h-10 px-5 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
              เปลี่ยนรหัสผ่าน
            </button>
          </form>
        </div>

        {/* 2FA */}
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-9 w-9 rounded-xl bg-[#7B61FF]/10 flex items-center justify-center">
              <Smartphone className="h-4.5 w-4.5 text-[#7B61FF]" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">การยืนยันตัวตน 2 ขั้น</h2>
              <p className="text-xs text-[#5A6A9A]">เพิ่มความปลอดภัยด้วย 2FA</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#030B2A] border border-[#0F1F55] mb-4">
            <div>
              <p className="text-sm font-medium text-white">สถานะ 2FA</p>
              <p className="text-xs text-[#5A6A9A] mt-0.5">ปิดใช้งานอยู่</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-[#0F1F55] relative cursor-not-allowed opacity-50">
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[#5A6A9A] transition-transform" />
            </div>
          </div>
          <p className="text-xs text-[#5A6A9A]">ฟีเจอร์นี้จะเปิดให้ใช้งานเร็วๆ นี้</p>

          <div className="mt-5 pt-5 border-t border-[#0F1F55]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-[#FF5252]/10 flex items-center justify-center">
                <LogOut className="h-4.5 w-4.5 text-[#FF5252]" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">ออกจากระบบทุกอุปกรณ์</h3>
                <p className="text-xs text-[#5A6A9A]">ยกเลิก session ทั้งหมด</p>
              </div>
            </div>
            <button className="h-9 px-4 rounded-lg text-sm font-medium border border-[#FF5252]/30 text-[#FF5252] hover:bg-[#FF5252]/10 transition-colors">
              ออกจากระบบทุกอุปกรณ์
            </button>
          </div>
        </div>

        {/* Login History */}
        <div className="lg:col-span-2 rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-9 w-9 rounded-xl bg-[#4FC3F7]/10 flex items-center justify-center">
              <History className="h-4.5 w-4.5 text-[#4FC3F7]" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">ประวัติการเข้าสู่ระบบ</h2>
              <p className="text-xs text-[#5A6A9A]">การเข้าสู่ระบบล่าสุด 10 ครั้ง</p>
            </div>
          </div>

          {loginHistory.length === 0 ? (
            <p className="text-sm text-[#5A6A9A] text-center py-8">ยังไม่มีประวัติการเข้าสู่ระบบ</p>
          ) : (
            <div className="space-y-1">
              {loginHistory.map((log, i) => (
                <div key={log.id} className={`flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#0A1845] transition-colors ${i !== loginHistory.length - 1 ? "border-b border-[#0F1F55]/50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#00D4FF]/10">
                      <History className="h-4 w-4 text-[#00D4FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {log.ip_address ? "เข้าสู่ระบบ" : "ไม่ทราบ"}
                      </p>
                      <p className="text-xs text-[#5A6A9A]">
                        IP: {log.ip_address || "ไม่ทราบ"} · {log.user_agent?.substring(0, 30) || "ไม่ทราบอุปกรณ์"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#5A6A9A]">
                    {log.logged_in_at ? new Date(log.logged_in_at).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
