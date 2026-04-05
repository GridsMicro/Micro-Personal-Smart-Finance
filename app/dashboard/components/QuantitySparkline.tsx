"use client";

import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface QuantitySparklineProps {
  data: Array<{ holdingsJson?: Record<string, number> }>;
  asset: string;
}

// Use a simple check for client-side rendering
const useIsClient = () => {
  return typeof window !== "undefined";
};

/**
 * QuantitySparkline - Mini chart showing asset quantity trend
 * 
 * Displays a sparkline chart for the selected asset's quantity over time
 */
export function QuantitySparkline({ data, asset }: QuantitySparklineProps) {
  const isClient = useIsClient();
  
  const sparkData = useMemo(() => 
    data.map(d => ({ q: d.holdingsJson?.[asset] || 0 })), 
    [data, asset]
  );
  
  if (!isClient || sparkData.length < 2) {
    return <div className="no-print w-16 h-4 border-b border-white/10 opacity-30" />;
  }
  
  const isUp = sparkData[sparkData.length - 1].q >= sparkData[0].q;
  
  return (
    <div className="no-print w-16 h-6">
       <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line 
              type="monotone" 
              dataKey="q" 
              stroke={isUp ? "#06b6d4" : "#EF4444"} 
              strokeWidth={1.5} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
       </ResponsiveContainer>
    </div>
  );
}
