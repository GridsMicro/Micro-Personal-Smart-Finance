"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Key, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleRotateKeys = () => {
    alert("รีเซ็ต API Keys แล้ว (Demo)");
  };

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="p-2 hover:bg-slate-800 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white">ความปลอดภัย</h1>
              <p className="text-sm text-slate-500">จัดการการเข้าถึงและความปลอดภัย</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Warning */}
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-500 mb-1">คำเตือนด้านความปลอดภัย</h4>
            <p className="text-sm text-red-500/80">
              อย่าแชร์ API Keys หรือข้อมูลลับกับ anyone การรั่วไหลอาจทำให้บัญชีถูกบุกรุก
            </p>
          </div>
        </div>

        {/* API Keys */}
        <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Key className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">API Keys</h2>
                <p className="text-sm text-slate-500">จัดการ API Keys สำหรับการเชื่อมต่อภายนอก</p>
              </div>
            </div>
            <button
              onClick={handleRotateKeys}
              className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              รีเซ็ต Keys
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <label className="block text-sm text-slate-400 mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value="pk_live_51HYs2jK8QJ4mP2vN9xYzAbCdEfGhIjKlMnOpQrStUvWxYz"
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <label className="block text-sm text-slate-400 mb-2">API Secret</label>
              <div className="flex gap-2">
                <input
                  type={showSecret ? "text" : "password"}
                  value="sk_live_•••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2FA */}
        <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Two-Factor Authentication</h2>
                <p className="text-sm text-slate-500">เพิ่มความปลอดภัยด้วย 2FA</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              เปิดใช้งานแล้ว
            </span>
          </div>
        </div>

        {/* Password Policy */}
        <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Lock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">นโยบายรหัสผ่าน</h2>
              <p className="text-sm text-slate-500">ตั้งค่าความเข้มงวดของรหัสผ่าน</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "ความยาวขั้นต่ำ 8 ตัวอักษร", enabled: true },
              { label: "ต้องมีตัวพิมพ์ใหญ่", enabled: true },
              { label: "ต้องมีตัวพิมพ์เล็ก", enabled: true },
              { label: "ต้องมีตัวเลข", enabled: true },
              { label: "ต้องมีสัญลักษณ์พิเศษ", enabled: false },
              { label: "ห้ามใช้รหัสผ่านเก่า", enabled: true },
            ].map((policy, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">{policy.label}</span>
                <div className={`w-2 h-2 rounded-full ${policy.enabled ? "bg-green-500" : "bg-slate-600"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Session Management */}
        <div className="p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
          <h2 className="text-lg font-bold text-white mb-4">เซสชั่นที่ใช้งานอยู่</h2>
          
          <div className="space-y-3">
            <div className="p-4 bg-slate-800/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Chrome on Windows</p>
                <p className="text-sm text-slate-500">IP: 203.0.113.1 • เข้าสู่ระบบ: 2 ชั่วโมงที่แล้ว</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                ปัจจุบัน
              </span>
            </div>
          </div>

          <button className="mt-4 w-full py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30">
            ออกจากระบบทุกอุปกรณ์
          </button>
        </div>
      </main>
    </div>
  );
}
