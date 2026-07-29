"use client";

import { useState } from "react";
import { Plus, Newspaper, Trash2, ExternalLink, Calendar } from "lucide-react";
import { createNews, deleteNews } from "@/actions/news";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  category_id: string | null;
  published_at: Date;
  created_at: Date | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminNewsClient({
  initialNews,
  categories,
}: {
  initialNews: (NewsItem & { category: Category | null })[];
  categories: Category[];
}) {
  const [newsList, setNewsList] = useState(initialNews);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    summary: "",
    source: "",
    source_url: "",
    category_id: "",
    published_at: new Date().toISOString().slice(0, 16),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createNews({
        title: form.title,
        content: form.content,
        summary: form.summary || undefined,
        source: form.source,
        source_url: form.source_url || undefined,
        category_id: form.category_id || undefined,
        published_at: new Date(form.published_at),
      });
      setShowForm(false);
      setForm({ title: "", content: "", summary: "", source: "", source_url: "", category_id: "", published_at: new Date().toISOString().slice(0, 16) });
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบข่าวนี้?")) return;
    try {
      await deleteNews(id);
      setNewsList((p) => p.filter((n) => n.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการข่าวสาร</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">{newsList.length} บทความ</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          เพิ่มข่าว
        </button>
      </div>

      {/* News List */}
      {newsList.length === 0 ? (
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-16 text-center">
          <Newspaper className="h-12 w-12 text-[#0F1F55] mx-auto mb-3" />
          <p className="text-sm text-[#5A6A9A]">ยังไม่มีข่าวสาร</p>
        </div>
      ) : (
        <div className="space-y-2">
          {newsList.map((article, i) => (
            <div key={article.id} className={`group flex items-start justify-between p-4 rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] hover:border-[#162660] transition-all`}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {article.category && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#00D4FF]/10 text-[#00D4FF]">
                      {article.category.name}
                    </span>
                  )}
                  <span className="text-xs text-[#5A6A9A] flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.published_at).toLocaleDateString("th-TH")}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white line-clamp-1">{article.title}</p>
                <p className="text-xs text-[#5A6A9A] mt-0.5">{article.source}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {article.source_url && (
                  <a href={article.source_url} target="_blank" rel="noreferrer" className="h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(article.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] hover:bg-[#FF5252]/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add News Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-6 animate-fade-in my-4">
            <h2 className="text-base font-semibold text-white mb-5">เพิ่มข่าวใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">หัวข้อข่าว *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" placeholder="หัวข้อข่าว" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">แหล่งที่มา *</label>
                  <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" placeholder="เช่น CoinDesk" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">URL แหล่งที่มา</label>
                  <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">หมวดหมู่</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all">
                    <option value="">ไม่มีหมวดหมู่</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">วันที่เผยแพร่ *</label>
                  <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} required className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm focus:outline-none focus:border-[#00D4FF] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">สรุปย่อ</label>
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full h-10 px-4 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all" placeholder="สรุปข่าวสั้นๆ" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#A0A0B0] block mb-1.5">เนื้อหา *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={5} className="w-full px-4 py-3 rounded-lg border border-[#0F1F55] bg-[#030B2A] text-white text-sm placeholder:text-[#5A6A9A] focus:outline-none focus:border-[#00D4FF] transition-all resize-none" placeholder="เนื้อหาข่าว..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-lg border border-[#162660] text-sm font-medium text-white hover:bg-[#0A1845] transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSaving && <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
