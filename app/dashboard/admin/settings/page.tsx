"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Smart Finance",
    maintenanceMode: false,
    allowRegistration: true,
    apiRefreshRate: "30",
    defaultCurrency: "THB",
    enableNotifications: true,
  });

  const handleSave = () => {
    alert("บันทึกการตั้งค่าแล้ว (Demo)");
  };

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/admin" className="p-2 hover:bg-slate-800 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-white">ตั้งค่าระบบ</h1>
                <p className="text-sm text-slate-500">ตั้งค่าและการตั้งค่าขั้นสูง</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-lg flex items-center gap-2 hover:bg-neon-cyan/30"
            >
              <Save className="w-4 h-4" />
              บันทึก
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Warning */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-500/80">
            การเปลี่ยนแปลงบางอย่างอาจต้องการการรีสตาร์ทเซิร์ฟเวอร์เพื่อให้มีผล
          </p>
        </div>

        {/* General Settings */}
        <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <h2 className="text-lg font-bold text-white mb-4">ทั่วไป</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">ชื่อเว็บไซต์</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">สกุลเงินเริ่มต้น</label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-neon-cyan focus:outline-none"
              >
                <option value="THB">THB (บาท)</option>
                <option value="USD">USD (ดอลลาร์)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">อัตราการรีเฟรช API (วินาที)</label>
              <input
                type="number"
                value={settings.apiRefreshRate}
                onChange={(e) => setSettings({...settings, apiRefreshRate: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <h2 className="text-lg font-bold text-white mb-4">ระบบ</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">โหมด Maintenance</p>
                <p className="text-sm text-slate-500">ปิดการใช้งานเว็บไซต์ชั่วคราว</p>
              </div>
              <button
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.maintenanceMode ? "bg-red-500" : "bg-slate-600"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? "translate-x-8" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">เปิดรับสมัครผู้ใช้ใหม่</p>
                <p className="text-sm text-slate-500">อนุญาตให้ผู้ใช้ใหม่ลงทะเบียน</p>
              </div>
              <button
                onClick={() => setSettings({...settings, allowRegistration: !settings.allowRegistration})}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.allowRegistration ? "bg-green-500" : "bg-slate-600"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.allowRegistration ? "translate-x-8" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">แจ้งเตือน</p>
                <p className="text-sm text-slate-500">เปิดใช้งานการแจ้งเตือนระบบ</p>
              </div>
              <button
                onClick={() => setSettings({...settings, enableNotifications: !settings.enableNotifications})}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.enableNotifications ? "bg-green-500" : "bg-slate-600"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.enableNotifications ? "translate-x-8" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
