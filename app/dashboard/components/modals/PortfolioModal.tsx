"use client";

import { useState } from "react";
import { X, Wallet } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { NeonButton } from "./ui/NeonButton";
import { EXCHANGES_MAPPED } from "../lib/constants";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (portfolioName: string, brokerId: string) => void;
}

export function PortfolioModal({ isOpen, onClose, onSave }: PortfolioModalProps) {
  const [portfolioName, setPortfolioName] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("BINANCE_TH");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-neon-cyan" />
            New Portfolio
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Portfolio Name</label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="My Portfolio"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Exchange/Wallet Type</label>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all"
            >
              {EXCHANGES_MAPPED.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <NeonButton variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </NeonButton>
          <NeonButton
            variant="primary"
            onClick={() => {
              if (portfolioName.trim()) {
                onSave(portfolioName.trim(), selectedBroker);
              }
            }}
            className="flex-1"
          >
            Create Portfolio
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
