import { getNews, getNewsCategories } from "@/actions/news";
import { redirectIfNotAuth } from "@/app/proxy/auth";
import { Calendar, ExternalLink, Newspaper } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function NewsPage() {
  await redirectIfNotAuth();
  const news = await getNews();
  const categories = await getNewsCategories();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">ข่าวสาร</h1>
        <p className="text-sm text-[#A0A0B0] mt-0.5">อัปเดตข่าวสารและข้อมูลตลาดล่าสุด</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button className="h-8 px-4 rounded-full text-xs font-semibold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 transition-all">
          ทั้งหมด
        </button>
        {categories.map((cat) => (
          <button key={cat.id} className="h-8 px-4 rounded-full text-xs font-medium border border-[#0F1F55] text-[#A0A0B0] hover:border-[#162660] hover:text-white transition-all">
            {cat.name}
          </button>
        ))}
      </div>

      {/* News Grid */}
      {news.length === 0 ? (
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#0A1845] flex items-center justify-center mx-auto mb-4">
            <Newspaper className="h-8 w-8 text-[#5A6A9A]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">ยังไม่มีข่าวสาร</h3>
          <p className="text-sm text-[#A0A0B0]">ข่าวสารทางการเงินจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article) => (
            <div key={article.id} className="group rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] overflow-hidden transition-all duration-300 hover:border-[#162660] hover:shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
              {article.image_url && (
                <div className="relative h-44 w-full overflow-hidden">
                  <Image src={article.image_url} alt={article.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040E35] to-transparent" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  {article.category && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00D4FF]/10 text-[#00D4FF]">
                      {article.category.name}
                    </span>
                  )}
                  <span className="text-xs text-[#5A6A9A] flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.published_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-snug">{article.title}</h3>
                <p className="text-xs text-[#A0A0B0] line-clamp-3 mb-4 leading-relaxed">
                  {article.summary || article.content?.substring(0, 150) + "..."}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5A6A9A]">{article.source}</span>
                  <Link href={article.source_url || "#"} target="_blank" className="flex items-center gap-1 text-xs text-[#00D4FF] hover:underline">
                    อ่านเพิ่ม <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
