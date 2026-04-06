"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { NeonButton } from "../ui/NeonButton";
import { SUPPORTED_ASSETS, EXCHANGES_MAPPED, PortfolioItem } from "../../lib/constants";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PortfolioItem> & { exchangeRate?: number }) => void;
  initialData?: (Partial<PortfolioItem> & { exchangeRate?: number }) | null;
  title: string;
  portfolioExchangeType?: string;
  portfolioName?: string;
  portfolios?: Array<any>;
  dynamicAssets?: string[];
}

export function AssetModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
  portfolioExchangeType,
  portfolioName,
  portfolios,
  dynamicAssets
}: AssetModalProps) {
  const assetsList = dynamicAssets && dynamicAssets.length > 0 ? dynamicAssets : SUPPORTED_ASSETS;
  const [asset, setAsset] = useState(initialData?.asset || assetsList[0] || "BTC");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [avgPrice, setAvgPrice] = useState(initialData?.avgPrice?.toString() || "");
  const [exchangeRate, setExchangeRate] = useState("");
  const [currency, setCurrency] = useState<"THB" | "USD">("THB");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(
    initialData?.broker || portfolioExchangeType || (portfolios && portfolios.length > 0 ? portfolios[0].id : "BINANCE_TH")
  );

  const broker = selectedPortfolioId;

  useEffect(() => {
    if (isOpen) {
      setAsset(initialData?.asset || "BTC");
      setAmount(initialData?.amount?.toString() || "");
      setAvgPrice(initialData?.avgPrice?.toString() || "");
      setExchangeRate(initialData?.exchangeRate?.toString() || "");
      setCurrency(initialData?.exchangeRate ? "USD" : "THB");
      setSelectedPortfolioId(initialData?.broker || portfolioExchangeType || (portfolios && portfolios.length > 0 ? portfolios[0].id : "BINANCE_TH"));
    }
  }, [isOpen, initialData, portfolioExchangeType, portfolios]);

  if (!isOpen) return null;

  const displayName = portfolioName || 
    EXCHANGES_MAPPED.find(e => e.id === broker)?.label || 
    broker;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Asset Select */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Asset</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all appearance-none"
            >
              {assetsList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Portfolio Select */}
          {portfolios && portfolios.length > 0 ? (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Adding to Portfolio</label>
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                disabled={!!initialData}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                           text-white font-mono focus:border-neon-cyan focus:outline-none
                           focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all disabled:opacity-50 appearance-none"
              >
                {portfolios.map(p => {
                  const exchangeLabel = EXCHANGES_MAPPED.find(e => e.id === p.broker)?.label || p.broker;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} (Type: {exchangeLabel})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-700/30">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest block">Adding to Portfolio</label>
                <p className="font-mono text-neon-cyan font-bold">{displayName}</p>
              </div>
              <div className="text-right">
                <label className="text-xs text-slate-500 uppercase tracking-widest block">Type</label>
                <p className="text-xs text-slate-400">{EXCHANGES_MAPPED.find(e => e.id === broker)?.label || broker}</p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Amount</label>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <label className="text-xs text-slate-500 uppercase tracking-widest">Price Currency</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrency("THB")}
                className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
                  currency === "THB"
                    ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                THB
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
                  currency === "USD"
                    ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD
              </button>
            </div>
          </div>

          {/* Avg Price */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">
              Average Buy Price ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Exchange Rate - Only show when USD selected */}
          {currency === "USD" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">
                Exchange Rate (THB/USD) <span className="text-slate-600">- Required</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="35.50"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                           text-white font-mono focus:border-neon-cyan focus:outline-none
                           focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all placeholder:text-slate-600"
              />
              <p className="text-[10px] text-slate-600 mt-1">
                Price in THB = USD Price × Exchange Rate
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <NeonButton variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </NeonButton>
          <NeonButton
            variant="primary"
            onClick={() => {
              onSave({
                asset,
                broker,
                amount: parseFloat(amount) || 0,
                avgPrice: currency === "USD" && avgPrice && exchangeRate
                  ? parseFloat(avgPrice) * parseFloat(exchangeRate)
                  : avgPrice ? parseFloat(avgPrice) : undefined,
                exchangeRate: currency === "USD" && exchangeRate
                  ? parseFloat(exchangeRate)
                  : undefined
              });
            }}
            className="flex-1"
          >
            Save Asset
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
