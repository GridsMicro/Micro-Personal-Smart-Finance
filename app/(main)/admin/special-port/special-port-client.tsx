"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ExternalLink, Pencil } from "lucide-react";
import {
  addSpecialHolding,
  deleteSpecialHolding,
  updateSpecialHolding,
} from "@/actions/public-portfolio";

interface Holding {
  id: string;
  coin_id: string;
  amount: string;
  cost_thb: string | null;
  buy_price_thb: string | null;
  bought_at: Date;
  note: string | null;
  asset_symbol: string | null;
  asset_name: string | null;
  asset_image: string | null;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
}

interface Props {
  portfolio: { id: string; name: string; description: string | null };
  holdings: Holding[];
  currentPrices: Record<string, { price_usd: string; price_thb: string | null; change_24h: string | null }>;
  assetList: Asset[];
}

export default function SpecialPortAdminClient({ portfolio, holdings: initialHoldings, currentPrices, assetList }: Props) {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [showAdd, setShowAdd] = useState(false);
  const [editHolding, setEditHolding] = useState<Holding | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [addForm, setAddForm] = useState({
    coin_id: assetList[0]?.id ?? "",
    amount: "",
    cost_thb: "",
    buy_price_thb: "",
    bought_at: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const [editForm, setEditForm] = useState({
    amount: "",
    cost_thb: "",
    buy_price_thb: "",
    note: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addSpecialHolding({ ...addForm, portfolio_id: portfolio.id });
      setShowAdd(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(h: Holding) {
    setEditHolding(h);
    setEditForm({
      amount: h.amount,
      cost_thb: h.cost_thb ?? "",
      buy_price_thb: h.buy_price_thb ?? "",
      note: h.note ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editHolding) return;
    setIsSaving(true);
    try {
      await updateSpecialHolding(editHolding.id, editForm);
      setHoldings((p) => p.map((h) => h.id === editHolding.id ? { ...h, ...editForm } : h));
      setEditHolding(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบ holding นี้?")) return;
    try {
      await deleteSpecialHolding(id);
      setHoldings((p) => p.filter((h) => h.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  const totalCost = holdings.reduce((s, h) => s + Number(h.cost_thb ?? 0), 0);
  const totalValue = holdings.reduce((h, holding) => {
    const price = currentPrices[holding.coin_id];
    const priceThb = price?.price_thb ? Number(price.price_thb) : 0;
    return h + Number(holding.amount) * priceThb;
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{portfolio.name}</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">จัดการ holdings ของพอร์ตสาธารณะ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/p/${portfolio.id}`} target="_blank">
            <button className="h-9 px-3 rounded-lg text-xs font-medium border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white transition-colors flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              ดูหน้าสาธารณะ
            </button>
          </Link>
          <button onClick={() => setShowAdd(true)}
            className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" />เพิ่ม Asset
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "จำนวน Asset", value: `${holdings.length} รายการ`, color: "#00D4FF" },
          { label: "ต้นทุนรวม", value: `฿${totalCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`, color: "#A0A0B0" },
          { label: "มูลค่าปัจจุบัน", value: `฿${totalValue.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`, color: totalValue >= totalCost ? "#00E676" : "#FF5252" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-4">
            <p className="text-xs text-[#A0A0B0] mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#0F1F55] text-xs font-semibold text-[#5A6A9A] uppercase tracking-wider">
          <div className="col-span-3">เหรียญ</div>
          <div className="col-span-2 text-right">จำนวน</div>
          <div className="col-span-2 text-right">ต้นทุน (THB)</div>
          <div className="col-span-2 text-right">ราคาซื้อ/เหรียญ</div>
          <div className="col-span-2 text-right">มูลค่าปัจจุบัน</div>
          <div className="col-span-1 text-right">จัดการ</div>
        </div>

        {holdings.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#5A6A9A]">ยังไม่มี holdings</div>
        ) : (
          holdings.map((h, i) => {
            const price = currentPrices[h.coin_id];
            const priceThb = price?.price_thb ? Number(price.price_thb) : 0;
            const currentValue = Number(h.amount) * priceThb;
            return (
              <div key={h.id} className={`group grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-[#0A1845]/50 transition-colors ${i !== holdings.length - 1 ? "border-b border-[#0F1F55]/50" : ""}`}>
                <div className="col-span-3 flex items-center gap-2">
                  {h.asset_image
                    ? <img src={h.asset_image} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                    : <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-[10px] font-bold text-white shrink-0">{(h.asset_symbol ?? h.coin_id)[0]}</div>
                  }
                  <div>
                    <p className="text-sm font-semibold text-white">{h.asset_symbol ?? h.coin_id.toUpperCase()}</p>
                    <p className="text-xs text-[#5A6A9A]">{new Date(h.bought_at).toLocaleDateString("th-TH")}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm text-white font-mono">{Number(h.amount).toFixed(8)}</div>
                <div className="col-span-2 text-right text-sm text-[#A0A0B0]">฿{Number(h.cost_thb ?? 0).toLocaleString("th-TH")}</div>
                <div className="col-span-2 text-right text-sm text-[#A0A0B0]">฿{Number(h.buy_price_thb ?? 0).toLocaleString("th-TH")}</div>
                <div className="col-span-2 text-right text-sm font-semibold" style={{ color: currentValue >= Number(h.cost_thb ?? 0) ? "#00E676" : "#FF5252" }}>
                  ฿{currentValue.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button onClick={() => openEdit(h)} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all opacity-0 group-hover:opacity-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(h.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] hover:bg-[#FF5252]/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-white mb-5">เพิ่ม Asset</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">เหรียญ</label>
                <select value={addForm.coin_id} onChange={(e) => setAddForm({ ...addForm, coin_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all">
                  {assetList.map((a) => <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">จำนวน</label>
                  <input value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} required placeholder="0.00000000"
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ต้นทุนรวม (THB)</label>
                  <input value={addForm.cost_thb} onChange={(e) => setAddForm({ ...addForm, cost_thb: e.target.value })} required placeholder="50000"
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ราคาซื้อ/เหรียญ (THB)</label>
                  <input value={addForm.buy_price_thb} onChange={(e) => setAddForm({ ...addForm, buy_price_thb: e.target.value })} required placeholder="2191577.4"
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">วันที่ซื้อ</label>
                  <input type="date" value={addForm.bought_at} onChange={(e) => setAddForm({ ...addForm, bought_at: e.target.value })} required
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">หมายเหตุ</label>
                <input value={addForm.note} onChange={(e) => setAddForm({ ...addForm, note: e.target.value })} placeholder="ซื้อครั้งแรก..."
                  className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSaving && <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}เพิ่ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-white mb-1">แก้ไข {editHolding.asset_symbol ?? editHolding.coin_id.toUpperCase()}</h2>
            <form onSubmit={handleEdit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">จำนวน</label>
                  <input value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ต้นทุนรวม (THB)</label>
                  <input value={editForm.cost_thb} onChange={(e) => setEditForm({ ...editForm, cost_thb: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ราคาซื้อ/เหรียญ (THB)</label>
                <input value={editForm.buy_price_thb} onChange={(e) => setEditForm({ ...editForm, buy_price_thb: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">หมายเหตุ</label>
                <input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditHolding(null)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSaving && <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
