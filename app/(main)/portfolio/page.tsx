"use client";

import { useState } from "react";
import { Plus, Wallet, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePortfolioPage } from "@/app/modules/portfolio/hooks";
import { Input } from "@/components/ui/input";

interface PortfolioFormData {
  name: string;
  type: string;
  description?: string;
}

export default function PortfolioPage() {
  const { portfolios, isLoading, create, remove, isCreating } = usePortfolioPage();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PortfolioFormData>({ name: "", type: "crypto", description: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create({ name: form.name, is_default: false });
      setShowModal(false);
      setForm({ name: "", type: "crypto", description: "" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถสร้างพอร์ตได้";
      alert(errorMessage);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ยืนยันการลบพอร์ตนี้?")) return;
    try {
      await remove(id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถลบพอร์ตได้";
      alert(errorMessage);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-[#00D4FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">พอร์ตการลงทุน</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">จัดการพอร์ตการลงทุนของคุณ</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          สร้างพอร์ตใหม่
        </button>
      </div>

      {/* Portfolio Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((p) => (
          <div key={p.id} className="group rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5 transition-all duration-300 hover:border-[#162660] hover:shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.25)]">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  {p.is_default && <span className="text-[10px] text-[#00D4FF] font-medium">ค่าเริ่มต้น</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] hover:bg-[#FF5252]/10 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0B0]">สินทรัพย์</span>
                <span className="text-white font-medium">{p.assetCount} รายการ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0B0]">สร้างเมื่อ</span>
                <span className="text-white">{p.created_at ? new Date(p.created_at).toLocaleDateString("th-TH") : "-"}</span>
              </div>
            </div>

            <Link href={`/portfolio/${p.id}`}>
              <button className="w-full h-9 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors flex items-center justify-center gap-2">
                ดูรายละเอียด
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        ))}

        {/* Add New Card */}
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl border-2 border-dashed border-[#0F1F55] hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/5 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-8 min-h-[200px] group"
        >
          <div className="h-10 w-10 rounded-xl border-2 border-dashed border-[#162660] group-hover:border-[#00D4FF]/50 flex items-center justify-center transition-colors">
            <Plus className="h-5 w-5 text-[#5A6A9A] group-hover:text-[#00D4FF] transition-colors" />
          </div>
          <span className="text-sm text-[#5A6A9A] group-hover:text-[#A0A0B0] transition-colors">สร้างพอร์ตใหม่</span>
        </button>
      </div>

      {/* Empty State */}
      {portfolios.length === 0 && (
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#0A1845] flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-[#5A6A9A]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">ยังไม่มีพอร์ตการลงทุน</h3>
          <p className="text-sm text-[#A0A0B0] max-w-sm mx-auto mb-6">เริ่มต้นสร้างพอร์ตแรกของคุณเพื่อติดตามการลงทุน</p>
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-6 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            สร้างพอร์ต
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 shadow-[0_10px_15px_rgba(0,0,0,0.5)] animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-5">สร้างพอร์ตใหม่</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">ชื่อพอร์ต</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น พอร์ตหลัก, Crypto" required />
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">ประเภท</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-10 rounded-lg border border-[#0F1F55] bg-[#030B2A] px-3 text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all"
                >
                  <option value="crypto">Crypto</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">คำอธิบาย (ไม่บังคับ)</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="คำอธิบายเกี่ยวกับพอร์ตนี้" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isCreating && <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
                  สร้าง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
