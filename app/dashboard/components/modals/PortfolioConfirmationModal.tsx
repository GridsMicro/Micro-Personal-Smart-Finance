"use client";

import { Sparkles } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { NeonButton } from "./ui/NeonButton";
import { EXCHANGES_MAPPED } from "../lib/constants";

interface PortfolioConfirmationModalProps {
  isOpen: boolean;
  portfolioName: string;
  exchangeType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PortfolioConfirmationModal({
  isOpen,
  portfolioName,
  exchangeType,
  onConfirm,
  onCancel
}: PortfolioConfirmationModalProps) {
  if (!isOpen) return null;

  const exchangeLabel = EXCHANGES_MAPPED.find(e => e.id === exchangeType)?.label || exchangeType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        {/* Success Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50
                        flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Sparkles className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-white text-center mb-2">
          Portfolio Created Successfully! ✅
        </h2>

        {/* Portfolio Info */}
        <div className="space-y-3 mb-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Portfolio Name</p>
            <p className="text-lg font-black text-neon-cyan font-mono">{portfolioName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Exchange/Wallet Type</p>
            <p className="text-sm text-white font-mono">{exchangeLabel}</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-400 text-center mb-6">
          Your portfolio is now ready! Click below to view it on the Overview page.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <NeonButton variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </NeonButton>
          <NeonButton variant="primary" onClick={onConfirm} className="flex-1">
            OK, Take Me There!
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
