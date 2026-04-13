"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Github, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = async (provider: string) => {
    setIsLoading(provider);
    setError("");
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(123,97,255,0.08)_0%,rgba(0,212,255,0.04)_40%,transparent_70%)] pointer-events-none" />

      {/* Back link */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-[#A0A0B0] hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        กลับหน้าหลัก
      </Link>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.35)] mb-4">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ยินดีต้อนรับกลับ</h1>
          <p className="text-sm text-[#A0A0B0] mt-1">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-7 shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-[#FF5252]/10 border border-[#FF5252]/20 text-[#FF5252] text-sm">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!isLoading}
              className="w-full h-11 rounded-lg border border-[#162660] bg-[#0A1845] text-white text-sm font-medium flex items-center justify-center gap-3 hover:bg-[#0F1F55] hover:border-[#3D3D52] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              เข้าสู่ระบบด้วย Google
            </button>

            <button
              onClick={() => handleOAuth("github")}
              disabled={!!isLoading}
              className="w-full h-11 rounded-lg border border-[#162660] bg-[#0A1845] text-white text-sm font-medium flex items-center justify-center gap-3 hover:bg-[#0F1F55] hover:border-[#3D3D52] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              เข้าสู่ระบบด้วย GitHub
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#0F1F55]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#040E35] px-3 text-xs text-[#5A6A9A]">
                ระบบจะสร้างบัญชีให้อัตโนมัติหากยังไม่มี
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-[#5A6A9A] leading-relaxed">
            การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
            <span className="text-[#00D4FF] cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
            {" "}และ{" "}
            <span className="text-[#00D4FF] cursor-pointer hover:underline">เงื่อนไขการใช้งาน</span>
          </p>
        </div>

        <p className="text-center text-xs text-[#5A6A9A] mt-6">
          © 2026 Microtronic Co., Ltd.
        </p>
      </div>
    </div>
  );
}
