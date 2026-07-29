"use client";

import { useState } from "react";
import { Plus, Coins, Trash2, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { createAsset, toggleAssetActive, deleteAsset, updateAsset } from "@/actions/market";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string | null;
  is_active: boolean | null;
  image_url: string | null;
  official_website: string | null;
  created_at: Date | null;
  price_source: string | null;
  coingecko_id: string | null;
}

export default function AdminAssetsClient({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ id: "", symbol: "", name: "", type: "crypto" as const, image_url: "", official_website: "" });
  const [editForm, setEditForm] = useState({ symbol: "", name: "", image_url: "", official_website: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const asset = await createAsset({
        id: form.id.toLowerCase().trim(),
        symbol: form.symbol.toUpperCase().trim(),
        name: form.name.trim(),
        type: form.type,
        image_url: form.image_url || undefined,
        official_website: form.official_website || undefined,
      });
      setAssets((p) => [asset, ...p]);
      setShowForm(false);
      setForm({ id: "", symbol: "", name: "", type: "crypto", image_url: "", official_website: "" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(asset: Asset) {
    setEditAsset(asset);
    setEditForm({
      symbol: asset.symbol,
      name: asset.name,
      image_url: asset.image_url ?? "",
      official_website: asset.official_website ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editAsset) return;
    setIsSaving(true);
    try {
      await updateAsset(editAsset.id, {
        symbol: editForm.symbol.toUpperCase().trim(),
        name: editForm.name.trim(),
        image_url: editForm.image_url || undefined,
        official_website: editForm.official_website || undefined,
      });
      setAssets((p) => p.map((a) => a.id === editAsset.id
        ? { ...a, symbol: editForm.symbol.toUpperCase(), name: editForm.name, image_url: editForm.image_url || null, official_website: editForm.official_website || null }
        : a
      ));
      setEditAsset(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(asset_id: string, current: boolean | null) {
    try {
      await toggleAssetActive(asset_id, !current);
      setAssets((p) => p.map((a) => a.id === asset_id ? { ...a, is_active: !current } : a));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleDelete(asset_id: string) {
    if (!confirm("ลบสินทรัพย์นี้?")) return;
    try {
      await deleteAsset(asset_id);
      setAssets((p) => p.filter((a) => a.id !== asset_id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการสินทรัพย์</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">{assets.length} สินทรัพย์ในระบบ</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" />เพิ่มสินทรัพย์
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#0F1F55] text-xs font-semibold text-[#5A6A9A] uppercase tracking-wider">
          <div className="col-span-4">สินทรัพย์</div>
          <div className="col-span-2">แหล่งราคา</div>
          <div className="col-span-2">ID (slug)</div>
          <div className="col-span-2 text-center">สถานะ</div>
          <div className="col-span-2 text-right">จัดการ</div>
        </div>

        {assets.length === 0 ? (
          <div className="py-16 text-center">
            <Coins className="h-12 w-12 text-[#0F1F55] mx-auto mb-3" />
            <p className="text-sm text-[#5A6A9A]">ยังไม่มีสินทรัพย์ในระบบ</p>
          </div>
        ) : (
          assets.map((asset, i) => (
            <div key={asset.id} className={`group grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-[#0A1845]/50 transition-colors ${i !== assets.length - 1 ? "border-b border-[#0F1F55]/50" : ""}`}>
              <div className="col-span-4 flex items-center gap-3">
                {asset.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.image_url} alt={asset.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {asset.symbol[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{asset.symbol}</p>
                  <p className="text-xs text-[#5A6A9A]">{asset.name}</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  asset.price_source === "bitkub"
                    ? "bg-[#00E676]/10 text-[#00E676]"
                    : asset.price_source === "manual"
                    ? "bg-[#FFB74D]/10 text-[#FFB74D]"
                    : "bg-[#00D4FF]/10 text-[#00D4FF]"
                }`}>
                  {asset.price_source ?? "coingecko"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-[#5A6A9A] font-mono">{asset.id}</span>
              </div>
              <div className="col-span-2 flex justify-center">
                <button onClick={() => handleToggle(asset.id, asset.is_active)}>
                  {asset.is_active
                    ? <ToggleRight className="h-5 w-5 text-[#00E676]" />
                    : <ToggleLeft className="h-5 w-5 text-[#5A6A9A]" />}
                </button>
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <button onClick={() => openEdit(asset)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all opacity-0 group-hover:opacity-100">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(asset.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] hover:bg-[#FF5252]/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-white mb-1">แก้ไขสินทรัพย์</h2>
            <p className="text-xs text-[#5A6A9A] mb-5 font-mono">{editAsset.id}</p>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">Symbol</label>
                  <input value={editForm.symbol} onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })} required
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all uppercase" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ชื่อ</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">URL โลโก้</label>
                <input value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  placeholder="https://..." className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
                {editForm.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editForm.image_url} alt="preview" className="h-8 w-8 rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                    <span className="text-xs text-[#5A6A9A]">preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">เว็บไซต์ทางการ</label>
                <input value={editForm.official_website} onChange={(e) => setEditForm({ ...editForm, official_website: e.target.value })}
                  placeholder="https://..." className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditAsset(null)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSaving && <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-white mb-5">เพิ่มสินทรัพย์ใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">Symbol *</label>
                  <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required placeholder="BTC"
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all uppercase" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ID (slug) *</label>
                  <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required placeholder="bitcoin"
                    className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">ชื่อ *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Bitcoin"
                  className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">URL โลโก้</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..."
                  className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">เว็บไซต์ทางการ</label>
                <input value={form.official_website} onChange={(e) => setForm({ ...form, official_website: e.target.value })} placeholder="https://bitcoin.org"
                  className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSaving && <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
                  เพิ่ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
