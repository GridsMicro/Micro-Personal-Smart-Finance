"use client";

import { useState } from "react";
import { User, Bell, Shield, Palette, Save } from "lucide-react";
import { Input } from "@/components/ui/input";

const tabs = [
  { id: "profile", label: "โปรไฟล์", icon: User },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "security", label: "ความปลอดภัย", icon: Shield },
  { id: "display", label: "การแสดงผล", icon: Palette },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${checked ? "bg-[#00D4FF]" : "bg-[#0F1F55]"}`}
    >
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "John Doe", email: "john@example.com", phone: "" });
  const [notifs, setNotifs] = useState({ priceAlerts: true, portfolioUpdates: true, marketNews: false, emailNotifications: true });
  const [display, setDisplay] = useState({ darkMode: true, compactView: false, autoRefresh: true, language: "th" });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">ตั้งค่า</h1>
        <p className="text-sm text-[#A0A0B0] mt-0.5">จัดการข้อมูลส่วนตัวและการตั้งค่าแอปพลิเคชัน</p>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* Tab Nav */}
        <div className="lg:w-52 shrink-0">
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-2 flex lg:flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                    activeTab === tab.id
                      ? "bg-[#00D4FF]/15 text-white border-l-2 border-[#00D4FF] pl-[10px]"
                      : "text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? "text-[#00D4FF]" : "text-[#5A6A9A]"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            {/* Profile */}
            {activeTab === "profile" && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white mb-5">ข้อมูลส่วนตัว</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ชื่อ</label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">อีเมล</label>
                    <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">เบอร์โทรศัพท์</label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="เพิ่มเบอร์โทรศัพท์" />
                </div>
                <button onClick={handleSave} disabled={isSaving} className="h-10 px-5 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> : <Save className="h-4 w-4" />}
                  บันทึก
                </button>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white mb-3">การแจ้งเตือน</h2>
                <p className="text-xs text-[#5A6A9A] mb-5">การตั้งค่าการแจ้งเตือนจะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white mb-5">ความปลอดภัย</h2>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">รหัสผ่านปัจจุบัน</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">รหัสผ่านใหม่</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <button className="h-10 px-5 rounded-lg text-sm font-medium border border-[#162660] text-white hover:bg-[#0A1845] transition-colors">
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            )}

            {/* Display */}
            {activeTab === "display" && (
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white mb-5">การแสดงผล</h2>
                {[
                  { key: "darkMode", label: "โหมดมืด", desc: "ใช้ธีมสีเข้มตลอดเวลา" },
                  { key: "compactView", label: "มุมมองแบบกระชับ", desc: "แสดงข้อมูลแบบกระชับขึ้น" },
                  { key: "autoRefresh", label: "รีเฟรชอัตโนมัติ", desc: "อัปเดตข้อมูลราคาอัตโนมัติ" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-[#0A1845] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-[#5A6A9A] mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={display[item.key as keyof typeof display] as boolean}
                      onChange={(v) => setDisplay({ ...display, [item.key]: v })}
                    />
                  </div>
                ))}
                <div className="py-4 px-3">
                  <label className="text-sm font-medium text-white block mb-2">ภาษา</label>
                  <select
                    value={display.language}
                    onChange={(e) => setDisplay({ ...display, language: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all"
                  >
                    <option value="th">ไทย</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
