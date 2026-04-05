import { readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Edit } from "lucide-react";
import Markdown from "react-markdown";

interface CoinPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

interface CoinData {
  symbol: string;
  name: string;
  official_website?: string;
  whitepaper_url?: string;
  created_by?: string;
  launch_date?: string;
  content: string;
}

async function getCoinData(symbol: string): Promise<CoinData | null> {
  try {
    const filePath = join(process.cwd(), "content", "coins", `${symbol.toLowerCase()}.md`);
    const fileContent = await readFile(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      symbol: data.symbol || symbol.toUpperCase(),
      name: data.name || symbol,
      official_website: data.official_website,
      whitepaper_url: data.whitepaper_url,
      created_by: data.created_by,
      launch_date: data.launch_date,
      content
    };
  } catch {
    return null;
  }
}

export default async function CoinDetailPage({ params }: CoinPageProps) {
  const { symbol } = await params;
  const coin = await getCoinData(symbol);

  if (!coin) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard/admin/coins"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-neon-cyan transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Coins List
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5
                          flex items-center justify-center border border-neon-cyan/30 shadow-[0_0_30px_rgba(0,245,255,0.2)]">
              <span className="text-3xl font-black text-neon-cyan">{coin.symbol}</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">{coin.name}</h1>
              <p className="text-lg text-slate-400 font-mono">{coin.symbol}</p>
            </div>
          </div>

          {/* Edit Instructions */}
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-2">Edit via VS Code:</p>
            <code className="text-xs text-neon-cyan bg-slate-900/50 px-3 py-2 rounded-lg">
              /content/coins/{symbol.toLowerCase()}.md
            </code>
          </div>
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {coin.official_website && (
            <a
              href={coin.official_website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50
                        hover:border-neon-cyan/30 hover:bg-slate-900/80 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-neon-cyan" />
                <span className="text-xs text-slate-500 uppercase">Official Website</span>
              </div>
              <p className="text-sm text-white truncate">{coin.official_website}</p>
            </a>
          )}

          {coin.whitepaper_url && (
            <a
              href={coin.whitepaper_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50
                        hover:border-neon-cyan/30 hover:bg-slate-900/80 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400 group-hover:text-neon-cyan" />
                <span className="text-xs text-slate-500 uppercase">Whitepaper</span>
              </div>
              <p className="text-sm text-white truncate">{coin.whitepaper_url}</p>
            </a>
          )}

          {coin.created_by && (
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 uppercase">Created By</span>
              </div>
              <p className="text-sm text-white">{coin.created_by}</p>
            </div>
          )}

          {coin.launch_date && (
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase mb-2">Launch Date</p>
              <p className="text-sm text-white">{coin.launch_date}</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-slate-900/30 rounded-2xl border border-slate-700/30 p-8">
          <article className="prose prose-invert prose-slate max-w-none
                           prose-headings:text-white prose-headings:font-black
                           prose-h1:text-3xl prose-h1:mb-6
                           prose-h2:text-xl prose-h2:text-neon-cyan prose-h2:mt-8 prose-h2:mb-4
                           prose-p:text-slate-300 prose-p:leading-relaxed
                           prose-strong:text-white prose-strong:font-bold
                           prose-ul:text-slate-300 prose-li:marker:text-neon-cyan
                           prose-code:text-neon-cyan prose-code:bg-slate-900/50 prose-code:px-1 prose-code:rounded
                           prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700">
            <Markdown>{coin.content}</Markdown>
          </article>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
          <p className="text-sm text-slate-400">
            <span className="text-neon-cyan">💡 Tip:</span> แก้ไขข้อมูลเหรียญนี้ได้โดยเปิดไฟล์{" "}
            <code className="text-neon-cyan">content/coins/{symbol.toLowerCase()}.md</code>{" "}
            ใน VS Code แล้วแก้ไขตามต้องการ
          </p>
        </div>
      </div>
    </div>
  );
}
