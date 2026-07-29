"use client";

import { useState } from "react";
import { Star, Trash2, Plus, Eye, List, ChevronDown } from "lucide-react";
import Link from "next/link";
import { createWatchlist, deleteWatchlist, removeWatchlistItem } from "@/actions/watchlist";

interface WatchlistItem {
  id: string;
  watchlist_id: string | null;
  asset_id: string;
  added_at: Date | null;
  notes?: string | null;
}

interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean | null;
  item_count: number;
  items: WatchlistItem[];
}

export default function WatchlistClient({ initialWatchlists }: { initialWatchlists: Watchlist[] }) {
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [activeId, setActiveId] = useState<string | null>(initialWatchlists[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeList = watchlists.find((w) => w.id === activeId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await createWatchlist({ name: newName.trim() });
      setNewName("");
      setShowCreate(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteList(id: string) {
    if (!confirm("ลบวอตช์ลิสต์นี้?")) return;
    try {
      await deleteWatchlist(id);
      setWatchlists((p) => p.filter((w) => w.id !== id));
      if (activeId === id) setActiveId(watchlists.find((w) => w.id !== id)?.id ?? null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRemoveItem(item_id: string) {
    try {
      await removeWatchlistItem(item_id);
      setWatchlists((prev) =>
        prev.map((w) => ({
          ...w,
          items: w.items.filter((i) => i.id !== item_id),
          item_count: w.items.filter((i) => i.id !== item_id).length,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">วอตช์ลิสต์</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">ติดตามสินทรัพย์ที่คุณสนใจ</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          สร้างลิสต์
        </button>
      </div>

      {watchlists.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#0A1845] flex items-center justify-center mx-auto mb-4">
            <Eye className="h-8 w-8 text-[#5A6A9A]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">ยังไม่มีวอตช์ลิสต์</h3>
          <p className="text-sm text-[#A0A0B0] max-w-sm mx-auto mb-6">สร้างวอตช์ลิสต์เพื่อติดตามสินทรัพย์ที่คุณสนใจ</p>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-6 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            สร้างวอตช์ลิสต์แรก
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-4">
          {/* Sidebar — list of watchlists */}
          <div className="lg:col-span-1 space-y-2">
            {watchlists.map((w) => (
              <div
                key={w.id}
                onClick={() => setActiveId(w.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  activeId === w.id
                    ? "bg-[#00D4FF]/15 border border-[#00D4FF]/30 text-white"
                    : "border border-[#0F1F55] text-[#A0A0B0] hover:bg-[#0A1845] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <List className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-[#5A6A9A]">{w.item_count} รายการ</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteList(w.id); }}
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] transition-all"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="lg:col-span-3 rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            {activeList ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-white">{activeList.name}</h2>
                  <Link href="/market">
                    <button className="h-8 px-3 rounded-lg text-xs font-medium border border-[#0F1F55] text-white hover:bg-[#0A1845] transition-colors flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่มสินทรัพย์
                    </button>
                  </Link>
                </div>

                {activeList.items.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-10 w-10 text-[#0F1F55] mx-auto mb-3" />
                    <p className="text-sm text-[#5A6A9A] mb-4">ยังไม่มีสินทรัพย์ในลิสต์นี้</p>
                    <Link href="/market">
                      <button className="h-8 px-4 rounded-lg text-xs font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] transition-all">
                        ไปที่ตลาด
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeList.items.map((item, i) => (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#0A1845] transition-colors ${
                          i !== activeList.items.length - 1 ? "border-b border-[#0F1F55]/50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FFB74D] to-[#FF9800] flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {item.asset_id[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white uppercase">{item.asset_id}</p>
                            <p className="text-xs text-[#5A6A9A]">
                              เพิ่มเมื่อ {item.added_at ? new Date(item.added_at).toLocaleDateString("th-TH") : "-"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] hover:bg-[#FF5252]/10 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[#5A6A9A] text-center py-8">เลือกวอตช์ลิสต์จากด้านซ้าย</p>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-white mb-4">สร้างวอตช์ลิสต์ใหม่</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อวอตช์ลิสต์"
                className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all"
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">
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
