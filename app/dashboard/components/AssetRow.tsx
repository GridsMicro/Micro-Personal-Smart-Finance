"use client";

import { Edit3, Trash2 } from "lucide-react";
import { PortfolioItem, MarketData } from "../lib/constants";
import { getPriceKey } from "../lib/priceUtils";
import { IconWithFallback } from "./IconWithFallback";

interface AssetRowProps {
  item: PortfolioItem;
  prices: MarketData;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AssetRow({ item, prices, onClick, onEdit, onDelete }: AssetRowProps) {
  const currentPrice = (prices[getPriceKey(item.broker)] as Record<string, number>)?.[item.asset] ?? 0;
  const value = item.amount * currentPrice;
  const avgPrice = item.avgPrice ?? 0;
  const pnl = currentPrice > 0 && avgPrice > 0
    ? ((currentPrice - avgPrice) / avgPrice) * 100
    : 0;

  return (
    <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
      <div className="col-span-3 flex items-center gap-3">
        <IconWithFallback asset={item.asset} className="w-8 h-8" />
        <div>
          <p className="font-bold text-white">{item.asset}</p>
          <p className="text-xs text-slate-500">{item.broker}</p>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <p className="text-white font-mono">
          {item.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </p>
      </div>
      <div className="col-span-2 text-right">
        <p className="text-slate-400 font-mono text-sm">
          ฿{currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className={`col-span-2 text-right ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        <p className="font-mono text-sm">
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </p>
      </div>
      <div className="col-span-2 text-right">
        <p className="text-neon-cyan font-mono font-bold">
          ฿{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className="col-span-1 flex justify-end gap-2">
        <button onClick={onEdit} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
