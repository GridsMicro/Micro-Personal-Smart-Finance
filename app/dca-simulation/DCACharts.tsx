"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import React from "react";

type Props = {
  data: {
    year: number;
    chartPoints: { date: string; value: number; invested: number }[];
    transactions: { date: string; price: number; amount: number }[];
    summary: { invested: number; finalValue: number; profit: number; profitPct: number };
  }[];
};

export default function DCACharts({ data }: Props) {
  return (
    <div className="space-y-8">
      {data.map((yearData) => (
        <section key={yearData.year} className="bg-[#071033] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Year {yearData.year}</h2>
            <div className="text-right text-sm">
              <div>Invested: ฿{yearData.summary.invested}</div>
              <div>Final: ฿{yearData.summary.finalValue}</div>
              <div className="mt-1">Profit: ฿{yearData.summary.profit} ({yearData.summary.profitPct}%)</div>
            </div>
          </div>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={yearData.chartPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f1530" />
                <XAxis dataKey="date" stroke="#9AA8D8" />
                <YAxis stroke="#9AA8D8" />
                <Tooltip formatter={(value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB' }).format(value)} />
                <Line type="monotone" dataKey="value" stroke="#00D4FF" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#9AA8D8]">
                    <th className="py-1 pr-4">Date</th>
                    <th className="py-1 pr-4">Price (THB)</th>
                    <th className="py-1 pr-4">BTC Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {yearData.transactions.map((t) => (
                    <tr key={t.date} className="border-t border-[#0F1F55]">
                      <td className="py-2">{t.date}</td>
                      <td className="py-2">{isFinite(t.price) ? `฿${t.price.toLocaleString()}` : "-"}</td>
                      <td className="py-2">{isFinite(t.amount) ? t.amount.toFixed(8) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
