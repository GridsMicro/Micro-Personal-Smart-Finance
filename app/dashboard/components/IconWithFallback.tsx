"use client";

import { useState } from "react";

// Expanded Extensions support: WEBP -> SVG -> PNG -> JPG
const EXT_TRIALS = [".webp", ".svg", ".png", ".jpg"];

export const ASSET_LOGOS: Record<string, string> = {
  "BTC": "/coins/BTC.svg", "ETH": "/coins/ETH.svg", "BNB": "/coins/BNB.svg",
  "USDT": "/coins/USDT.svg", "USDC": "/coins/USDC.svg", "SOL": "/coins/SOL.svg",
  "AVAX": "/coins/AVAX.png", "ADA": "/coins/ADA.svg", "DOT": "/coins/DOT.png",
  "DOGE": "/coins/DOGE.svg", "XRP": "/coins/XRP.svg", "NEAR": "/coins/NEAR.png",
  "ORDI": "/coins/ORDI.svg", "MOODENG": "/coins/MOODENG.png", "GOAT": "/coins/GOAT.png",
  "AVEX": "/coins/AVEX.svg", "SATS": "/coins/SATS.png",
  "THB": "/coins/tl.webp",
  "BINANCE_TH": "/coins/BINANCE-EX.png", "BITKUB": "/coins/BITKUB-EX.png", "OKX": "/coins/OKX_logo.svg.png"
};

interface IconWithFallbackProps {
  asset: string;
  className?: string;
}

/**
 * IconWithFallback - Display asset icon with automatic fallback
 * 
 * Tries multiple image formats in sequence (webp -> svg -> png -> jpg)
 * Falls back to default icon if all fail
 */
export function IconWithFallback({ asset, className = "w-10 h-10" }: IconWithFallbackProps) {
  const [trialIndex, setTrialIndex] = useState(0);
  const [showDefaultIcon, setShowDefaultIcon] = useState(false);
  
  // Try different extensions sequentially or use explicit mapping
  const getTrialSrc = () => {
    if (ASSET_LOGOS[asset] && trialIndex === 0) return ASSET_LOGOS[asset];
    return `/coins/${asset}${EXT_TRIALS[trialIndex]}`;
  };

  const handleNextTrial = () => {
    if (trialIndex < EXT_TRIALS.length - 1) {
      setTrialIndex(trialIndex + 1);
    } else {
      setShowDefaultIcon(true);
    }
  };

  if (showDefaultIcon) {
    if (asset === "THB") {
      return (
        <div className={`${className} bg-blue-600 rounded-full flex items-center justify-center font-black text-[10px] text-white border border-blue-400/20 shadow-lg shadow-blue-500/20`}>
          ฿
        </div>
      );
    }
    return (
      <div className={`${className} bg-zinc-800 rounded-full flex items-center justify-center font-black text-[9px] text-zinc-500 border border-white/5 uppercase`}>
        {asset.substring(0, 2)}
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center border border-white/10 shadow-xl transition-all hover:scale-105 active:scale-95`}>
       <img 
          src={getTrialSrc()} 
          onError={handleNextTrial} 
          className="w-[82%] h-[82%] object-contain pointer-events-none" 
          alt={asset} 
       />
    </div>
  );
}
