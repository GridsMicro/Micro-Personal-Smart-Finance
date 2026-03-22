"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginWithSuperAdmin } from "../actions/authActions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // ตรวจสอบกับ API Service กลาง (มาตรฐาน SuperAdmin)
    const superAdminRes = await loginWithSuperAdmin(email, password);
    if (superAdminRes.success) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // กรณีไม่ผ่าน SuperAdmin, แจ้งเตือน (หรือคุณต้องการระบบ Email/Password ของตัวเองแจ้งได้นะครับ)
    setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือคุณต้องเข้าใช้ผ่าน Google");
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#27272a] font-sans p-6">
      <div className="w-full max-w-md p-8 bg-[#27272a] border border-white/5 rounded-3xl shadow-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Smart Planner</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">ลงชื่อเข้าใช้ระบบ (Login)</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1" htmlFor="email">
              อีเมล (Email)
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1" htmlFor="password">
              รหัสผ่าน (Password)
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "กำลังดำเนินการ..." : "ลงชื่อเข้าใช้ (Sign In)"}
            </button>
          </div>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200 dark:border-zinc-800"></div>
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">เข้าง่ายๆ ผ่านโซเชียล</span>
          <div className="flex-1 border-t border-gray-200 dark:border-zinc-800"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-300 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

      </div>
    </div>
  );
}
