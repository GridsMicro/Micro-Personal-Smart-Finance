import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import Link from "next/link";
import { Coins, ExternalLink } from "lucide-react";

interface CoinInfo {
  slug: string;
  symbol: string;
  name: string;
  official_website?: string;
  created_by?: string;
}

async function getCoins(): Promise<CoinInfo[]> {
  const contentDir = join(process.cwd(), "content", "coins");

  try {
    const files = await readdir(contentDir);
    const mdFiles = files.filter(f => f.endsWith(".md"));

    const coins = await Promise.all(
      mdFiles.map(async (file) => {
        const slug = file.replace(".md", "");
        const content = await readFile(join(contentDir, file), "utf-8");
        const { data } = matter(content);

        return {
          slug,
          symbol: data.symbol || slug.toUpperCase(),
          name: data.name || slug,
          official_website: data.official_website,
          created_by: data.created_by
        };
      })
    );

    return coins.sort((a, b) => a.symbol.localeCompare(b.symbol));
  } catch {
    return [];
  }
}

export default async function CoinsAdminPage() {
  const coins = await getCoins();

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5
                          flex items-center justify-center border border-neon-cyan/30">
              <Coins className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Coin Management</h1>
              <p className="text-slate-400">Manage supported coins and their information</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            {coins.length} coins registered
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <h2 className="text-sm font-bold text-neon-cyan mb-2">📁 How to Add/Edit Coins</h2>
          <p className="text-sm text-slate-400 mb-2">
            Coins are managed via Markdown files in <code className="text-neon-cyan">/content/coins/</code>
          </p>
          <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
            <li>Create new file: <code className="text-slate-300">symbol.md</code> (e.g., <code>btc.md</code>)</li>
            <li>Add YAML frontmatter with metadata (symbol, name, website, etc.)</li>
            <li>Write content in Markdown format</li>
            <li>Changes auto-reflect on this page after refresh</li>
          </ul>
        </div>

        {/* Coins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coins.map((coin) => (
            <Link
              key={coin.slug}
              href={`/dashboard/admin/coins/${coin.slug}`}
              className="group p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50
                        hover:border-neon-cyan/30 hover:bg-slate-900/80 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900
                                flex items-center justify-center border border-slate-700">
                    <span className="text-lg font-bold text-neon-cyan">{coin.symbol[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-neon-cyan transition-colors">
                      {coin.symbol}
                    </h3>
                    <p className="text-xs text-slate-400">{coin.name}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-neon-cyan" />
              </div>

              {coin.created_by && (
                <p className="text-xs text-slate-500">
                  Created by: <span className="text-slate-400">{coin.created_by}</span>
                </p>
              )}

              {coin.official_website && (
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Website: <span className="text-slate-400">{coin.official_website}</span>
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {coins.length === 0 && (
          <div className="text-center py-16">
            <Coins className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No coins found</p>
            <p className="text-sm text-slate-500 mt-2">
              Create files in /content/coins/ to add coins
            </p>
          </div>
        )}

        {/* Template Section */}
        <div className="mt-12 p-6 bg-slate-900/30 rounded-xl border border-slate-700/30">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Template for New Coin</h3>
          <pre className="text-xs text-slate-400 bg-slate-950/50 p-4 rounded-lg overflow-x-auto">
{`---
symbol: YOUR_SYMBOL
name: Coin Name
official_website: https://example.com
whitepaper_url: https://example.com/whitepaper
created_by: Creator Name
launch_date: YYYY-MM-DD
---

# Coin Name (SYMBOL)

## จุดประสงค์
Describe the purpose of this coin/project

## สถาปัตยกรรม
- Consensus: Proof of X
- Max Supply: XXX
- Block Time: ~X minutes

## การใช้งานในปัจจุบัน
Describe current use cases
`}
          </pre>
        </div>
      </div>
    </div>
  );
}
