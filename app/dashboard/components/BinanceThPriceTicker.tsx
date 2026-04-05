"use client";

/**
 * Binance TH WebSocket Price Ticker Component
 * 
 * MIGRATION NOTE: This component uses WebSocket instead of REST API because:
 * 1. RATE LIMIT: Binance TH REST API /ticker/24hr has weight ~80 per call
 *    - 6,000 weight/min limit = only ~75 calls/min before getting banned
 *    - WebSocket has no rate limiting for ticker streams
 * 2. REAL-TIME: WebSocket pushes updates immediately vs polling every 30s
 * 3. LATENCY: No HTTP handshake overhead for each update
 * 4. BANDWIDTH: Only receives changed data, not full payload every time
 * 
 * WebSocket URL: wss://ws-api.binance.th:443/ws-api/v3
 * Fallback: REST API /api/v3/ticker/price for specific symbols only
 */

import { useBinanceThWebSocket } from "../../hooks/useBinanceThWebSocket";

interface BinanceThPriceTickerProps {
  symbols?: string[]; // Optional: specific symbols to track, empty = all
  maxDisplay?: number; // Max pairs to show (default: 10)
}

export function BinanceThPriceTicker({ 
  symbols = [], 
  maxDisplay = 10 
}: BinanceThPriceTickerProps) {
  const { thbPairs, isConnected, error, metrics } = useBinanceThWebSocket(symbols);

  // Format price with Thai Baht symbol
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Format percentage change
  const formatChange = (change: string) => {
    const num = parseFloat(change);
    const isPositive = num >= 0;
    return {
      text: `${isPositive ? "+" : ""}${num.toFixed(2)}%`,
      color: isPositive ? "text-green-400" : "text-red-400",
      bg: isPositive ? "bg-green-400/10" : "bg-red-400/10",
    };
  };

  if (error) {
    return (
      <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="font-bold">Binance TH WebSocket Error</span>
        </div>
        <p className="text-sm text-slate-400 mt-2">{error}</p>
        <p className="text-xs text-slate-500 mt-1">
          Falling back to REST API on next refresh
        </p>
      </div>
    );
  }

  const displayPairs = thbPairs.slice(0, maxDisplay);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-neon-green animate-pulse" : "bg-yellow-400"
            }`}
          />
          <h3 className="font-bold text-white">Binance TH</h3>
          <span className="text-xs text-slate-500">(WebSocket)</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">
            {metrics.messagesReceived} updates
          </span>
          {metrics.connectionTime > 0 && (
            <span className="text-xs text-slate-600 block">
              connected in {metrics.connectionTime.toFixed(0)}ms
            </span>
          )}
        </div>
      </div>

      {/* Price Grid */}
      {displayPairs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {displayPairs.map((pair) => {
            const change = formatChange(pair.priceChangePercent);
            return (
              <div
                key={pair.symbol}
                className="bg-slate-800/50 p-3 rounded-lg hover:bg-slate-800/70 transition-colors"
              >
                <p className="text-xs text-slate-400 mb-1">
                  {pair.symbol.replace("THB", "")}
                </p>
                <p className="text-sm font-mono text-neon-cyan">
                  {formatPrice(pair.lastPrice)}
                </p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${change.bg} ${change.color}`}
                >
                  {change.text}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          {isConnected ? (
            <p>Waiting for data...</p>
          ) : (
            <p>Connecting to WebSocket...</p>
          )}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-600">
          Using WebSocket to avoid REST API rate limits (6,000 weight/min)
        </p>
      </div>
    </div>
  );
}
