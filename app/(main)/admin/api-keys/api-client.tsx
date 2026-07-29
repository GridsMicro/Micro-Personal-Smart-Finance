"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Key, Clock, CheckCircle, XCircle, Zap, Globe } from "lucide-react";

interface PriceResult {
  success: boolean;
  recorded?: number;
  timestamp?: string;
  prices?: { asset: string; price_usd: number }[];
  error?: string;
}

export default function AdminApiClient() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [testIds, setTestIds] = useState("bitcoin,tron");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [seedAsset, setSeedAsset] = useState("bitcoin");
  const [seedDays, setSeedDays] = useState("14");
  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    inserted?: number;
    records?: { date: string; price_usd: string }[];
    error?: string;
  } | null>(null);
  const [assetList, setAssetList] = useState<{ id: string; symbol: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/prices/assets")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAssetList(data); })
      .catch(() => {});
  }, []);

  async function handleUpdatePrices() {
    setIsUpdating(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/record-prices", {
        headers: { Authorization: "Bearer micro-cron-secret-2026" },
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSeedPrices() {
    setIsSeedLoading(true);
    setSeedResult(null);
    try {
      const res = await fetch(`/api/admin/seed-prices?asset=${seedAsset}&days=${seedDays}`, {
        headers: { Authorization: "Bearer micro-cron-secret-2026" },
      });
      const data = await res.json();
      setSeedResult(data);
    } catch (err) {
      setSeedResult({ success: false, error: String(err) });
    } finally {
      setIsSeedLoading(false);
    }
  }

  async function handleTestApi() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/prices?ids=${testIds}`);
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: String(err) });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">จัดการ API</h1>
        <p className="text-sm text-[#A0A0B0] mt-0.5">ตั้งค่าและทดสอบ API สำหรับดึงราคาเหรียญ</p>
      </div>

      {/* Price Source Info */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center">
            <Globe className="h-4.5 w-4.5 text-[#00D4FF]" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">แหล่งข้อมูลราคา</h2>
            <p className="text-xs text-[#5A6A9A]">CoinGecko Free API</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Endpoint", value: "api.coingecko.com/api/v3", color: "#00D4FF" },
            { label: "Rate Limit", value: "30 calls/min (Free tier)", color: "#FFB74D" },
            { label: "Cache", value: "60 วินาที (Next.js revalidate)", color: "#00E676" },
            { label: "Cron Schedule", value: "ทุกวัน 06:00 ICT (23:00 UTC)", color: "#7B61FF" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-[#030B2A] border border-[#0F1F55]">
              <span className="text-xs text-[#5A6A9A]">{item.label}</span>
              <span className="text-xs font-medium" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seed Historical Prices */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center">
            <Clock className="h-4.5 w-4.5 text-[#00D4FF]" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">ดึงราคาจริงย้อนหลัง</h2>
            <p className="text-xs text-[#5A6A9A]">ดึงจาก CoinGecko Historical API (ราคาจริง)</p>
          </div>
        </div>
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={seedAsset} onChange={(e) => setSeedAsset(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all">
            {assetList.length > 0
              ? assetList.map((a) => (
                  <option key={a.id} value={a.id}>{a.symbol}</option>
                ))
              : <option value="bitcoin">BTC</option>
            }
          </select>
          <select value={seedDays} onChange={(e) => setSeedDays(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all">
            <option value="14">14 วัน</option>
            <option value="30">30 วัน</option>
            <option value="90">90 วัน</option>
          </select>
          <button onClick={handleSeedPrices} disabled={isSeedLoading}
            className="h-10 px-5 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center gap-2">
            {isSeedLoading
              ? <><div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />กำลังดึง...</>
              : "ดึงราคาจริง"}
          </button>
        </div>
        {seedResult && (
          <div className={`p-4 rounded-lg border ${seedResult.success ? "border-[#00D4FF]/30 bg-[#00D4FF]/5" : "border-[#FF5252]/30 bg-[#FF5252]/5"}`}>
            {seedResult.success ? (
              <>
                <p className="text-sm font-medium text-[#00D4FF] mb-2">✅ บันทึกสำเร็จ {seedResult.inserted} รายการ</p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {seedResult.records?.map((r, i) => (
                    <div key={`${r.date}-${i}`} className="flex justify-between text-xs text-[#A0A0B0] px-2 py-1 rounded bg-[#030B2A]">
                      <span>{r.date}</span>
                      <span className="text-white">${Number(r.price_usd).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#FF5252]">❌ {seedResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Manual Price Update */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-[#7B61FF]/10 flex items-center justify-center">
            <Zap className="h-4.5 w-4.5 text-[#7B61FF]" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">อัปเดตราคาทันที</h2>
            <p className="text-xs text-[#5A6A9A]">บันทึกราคาปัจจุบันของทุกเหรียญลง DB</p>
          </div>
        </div>
        <button onClick={handleUpdatePrices} disabled={isUpdating}
          className="h-10 px-5 rounded-lg text-sm font-semibold bg-[#7B61FF] text-white hover:bg-[#5A47CC] disabled:opacity-50 transition-all flex items-center gap-2">
          {isUpdating
            ? <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />กำลังอัปเดต...</>
            : <><RefreshCw className="h-4 w-4" />อัปเดตราคาตอนนี้</>}
        </button>
        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${result.success ? "border-[#00E676]/30 bg-[#00E676]/5" : "border-[#FF5252]/30 bg-[#FF5252]/5"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? <CheckCircle className="h-4 w-4 text-[#00E676]" /> : <XCircle className="h-4 w-4 text-[#FF5252]" />}
              <span className={`text-sm font-medium ${result.success ? "text-[#00E676]" : "text-[#FF5252]"}`}>
                {result.success ? `บันทึกสำเร็จ ${result.recorded} เหรียญ` : `Error: ${result.error}`}
              </span>
            </div>
            {result.prices?.map((p) => (
              <div key={p.asset} className="flex justify-between text-xs text-[#A0A0B0]">
                <span className="uppercase">{p.asset}</span>
                <span className="text-white">${p.price_usd.toLocaleString()}</span>
              </div>
            ))}
            {result.timestamp && (
              <p className="text-xs text-[#5A6A9A] mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(result.timestamp).toLocaleString("th-TH")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Test API */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-[#00E676]/10 flex items-center justify-center">
            <Key className="h-4.5 w-4.5 text-[#00E676]" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">ทดสอบ Real-time API</h2>
            <p className="text-xs text-[#5A6A9A]">ดึงราคาจาก CoinGecko โดยตรง</p>
          </div>
        </div>
        <div className="flex gap-3 mb-4">
          <input value={testIds} onChange={(e) => setTestIds(e.target.value)} placeholder="bitcoin,tron"
            className="flex-1 h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
          <button onClick={handleTestApi} disabled={isTesting}
            className="h-10 px-4 rounded-lg text-sm font-semibold bg-[#00E676] text-black hover:bg-[#00C853] disabled:opacity-50 transition-all flex items-center gap-2">
            {isTesting ? <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> : "ทดสอบ"}
          </button>
        </div>
        {testResult && (
          <div className="p-4 rounded-lg bg-[#030B2A] border border-[#0F1F55]">
            <pre className="text-xs text-[#A0A0B0] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Cron Config */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Cron Job Config (vercel.json)</h2>
        <pre className="text-xs text-[#A0A0B0] bg-[#030B2A] p-4 rounded-lg border border-[#0F1F55] overflow-x-auto">{`{
  "crons": [{
    "path": "/api/cron/record-prices",
    "schedule": "0 23 * * *"
  }]
}`}</pre>
        <p className="text-xs text-[#5A6A9A] mt-2">
          ต้องตั้งค่า <span className="text-[#00D4FF]">CRON_SECRET</span> ใน Vercel Environment Variables ด้วย
        </p>
      </div>
    </div>
  );
}
