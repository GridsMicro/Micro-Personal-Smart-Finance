"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { GlassCard } from "./ui/GlassCard";
import { NeonButton } from "./ui/NeonButton";
import { MarketData, DailySnapshot } from "../lib/constants";
import { IconWithFallback } from "./IconWithFallback";

interface AssetDetailViewProps {
  asset: string;
  data: DailySnapshot[];
  prices: MarketData;
  onBack: () => void;
}

export function AssetDetailView({ asset, data, prices, onBack }: AssetDetailViewProps) {
  const assetData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      quantity: d.holdingsJson?.[asset] || 0,
      value: (d.holdingsJson?.[asset] || 0) * 1000
    }));
  }, [data, asset]);

  const totalQuantity = assetData[assetData.length - 1]?.quantity || 0;
  const currentPrice = prices.binance[asset] || prices.bitkub[asset] || prices.okx[asset] || 0;
  const totalValue = totalQuantity * currentPrice;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconWithFallback asset={asset} className="w-16 h-16" />
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">{asset}</h2>
            <p className="text-neon-cyan font-mono text-lg">฿{currentPrice.toLocaleString()}</p>
          </div>
        </div>
        <NeonButton variant="secondary" onClick={onBack} icon={X}>
          Close
        </NeonButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Total Quantity</p>
          <p className="text-2xl font-black text-white font-mono mt-2">
            {totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Total Value</p>
          <p className="text-2xl font-black text-neon-cyan font-mono mt-2 shadow-neon-cyan">
            ฿{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">% of Portfolio</p>
          <p className="text-2xl font-black text-neon-purple font-mono mt-2">
            --%
          </p>
        </GlassCard>
      </div>

      {/* Chart */}
      <GlassCard className="p-6 h-80">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">
          Holdings History
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={assetData}>
            <defs>
              <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
              itemStyle={{ color: '#00F5FF', fontWeight: 900 }}
            />
            <Area
              type="monotone"
              dataKey="quantity"
              stroke="#00F5FF"
              strokeWidth={3}
              fill="url(#assetGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
