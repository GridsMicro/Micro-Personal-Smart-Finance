"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BinanceThTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openPrice: string;
  prevClosePrice: string;
  weightedAvgPrice: string;
}

interface UseBinanceThWebSocketReturn {
  tickers: BinanceThTicker[];
  thbPairs: BinanceThTicker[];
  isConnected: boolean;
  error: string | null;
  metrics: {
    messagesReceived: number;
    lastUpdateTime: number;
    connectionTime: number;
  };
}

const BINANCE_TH_WS_URL = "wss://ws-api.binance.th:443/ws-api/v3";

export function useBinanceThWebSocket(
  symbols: string[] = []
): UseBinanceThWebSocketReturn {
  const [tickers, setTickers] = useState<BinanceThTicker[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    messagesReceived: 0,
    lastUpdateTime: 0,
    connectionTime: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const connectTimeRef = useRef<number>(0);
  const messagesCountRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[Binance TH WS] Already connected");
      return;
    }

    try {
      console.log("[Binance TH WS] Connecting...");
      setError(null);

      const ws = new WebSocket(BINANCE_TH_WS_URL);
      wsRef.current = ws;
      connectTimeRef.current = performance.now();

      ws.onopen = () => {
        console.log("[Binance TH WS] Connected");
        setIsConnected(true);
        setMetrics((prev) => ({
          ...prev,
          connectionTime: performance.now() - connectTimeRef.current,
        }));

        // Subscribe to ticker data
        const subscribeMsg = {
          id: Date.now().toString(),
          method: "ticker.24hr",
          params: symbols.length > 0 ? { symbols } : {},
        };

        ws.send(JSON.stringify(subscribeMsg));
        console.log("[Binance TH WS] Subscribed to ticker data");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messagesCountRef.current += 1;

          if (data.result) {
            setTickers(data.result);
            setMetrics({
              messagesReceived: messagesCountRef.current,
              lastUpdateTime: Date.now(),
              connectionTime: performance.now() - connectTimeRef.current,
            });
          }
        } catch (err) {
          console.error("[Binance TH WS] Error parsing message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[Binance TH WS] Error:", err);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log(
          `[Binance TH WS] Disconnected (code: ${event.code}, reason: ${event.reason})`
        );
        setIsConnected(false);

        // Auto-reconnect after 5 seconds if not intentionally closed
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log("[Binance TH WS] Attempting to reconnect...");
            connectRef.current?.();
          }, 5000);
        }
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect WebSocket"
      );
    }
  }, [symbols]);

  // Store connect function in ref for access in callbacks
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Filter THB pairs
  const thbPairs = tickers.filter((ticker) =>
    ticker.symbol.endsWith("THB")
  );

  return {
    tickers,
    thbPairs,
    isConnected,
    error,
    metrics,
  };
}
