"use client";

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
}

export function TradingViewChart({ symbol }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous children
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Symbol translation and exchange mapping
    let exchange = "BINANCE";
    let pair = `${symbol}USDT`;

    // Specific mappings
    if (["MOODENG", "GOAT", "ORDI", "SATS"].includes(symbol)) {
      exchange = "OKX";
    }
    
    if (symbol === "SATS") pair = "1000SATSUSDT";
    if (symbol === "BTC" || symbol === "ETH") {
       exchange = "BINANCE";
       pair = `${symbol}USDT`;
    }

    const tvSymbol = `${exchange}:${pair}`;
    
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Asia/Bangkok",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-800" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}
