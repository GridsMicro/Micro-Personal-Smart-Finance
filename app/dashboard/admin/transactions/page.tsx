"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Search, Filter, Download } from "lucide-react";

interface Transaction {
  id: string;
  type: "buy" | "sell" | "transfer";
  coin: string;
  amount: number;
  price: number;
  total: number;
  user: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "tx1", type: "buy", coin: "BTC", amount: 0.5, price: 69000, total: 34500, user: "user1@example.com", status: "completed", date: "2024-04-06 10:30" },
  { id: "tx2", type: "sell", coin: "ETH", amount: 2.5, price: 3500, total: 8750, user: "user2@example.com", status: "completed", date: "2024-04-06 09:15" },
  { id: "tx3", type: "buy", coin: "SOL", amount: 100, price: 150, total: 15000, user: "user1@example.com", status: "pending", date: "2024-04-06 08:45" },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  const filteredTransactions = transactions.filter(tx =>
    tx.coin.toLowerCase().includes(search.toLowerCase()) ||
    tx.user.toLowerCase().includes(search.toLowerCase()) ||
    tx.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="p-2 hover:bg-slate-800 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white">ธุรกรรม</h1>
              <p className="text-sm text-slate-500">ดูประวัติและจัดการธุรกรรม</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl">
            <p className="text-sm text-slate-500">ทั้งหมด</p>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
          </div>
          <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl">
            <p className="text-sm text-slate-500">สำเร็จ</p>
            <p className="text-2xl font-bold text-green-500">
              {transactions.filter(t => t.status === "completed").length}
            </p>
          </div>
          <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl">
            <p className="text-sm text-slate-500">รอดำเนินการ</p>
            <p className="text-2xl font-bold text-yellow-500">
              {transactions.filter(t => t.status === "pending").length}
            </p>
          </div>
          <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl">
            <p className="text-sm text-slate-500">มูลค่ารวม</p>
            <p className="text-2xl font-bold text-neon-cyan">
              ${transactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาธุรกรรม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <button className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
            ตัวกรอง
          </button>
          <button className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2 hover:bg-slate-700">
            <Download className="w-4 h-4" />
            ส่งออก
          </button>
        </div>

        {/* Table */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-6 py-4 font-medium">รหัส</th>
                <th className="px-6 py-4 font-medium">ประเภท</th>
                <th className="px-6 py-4 font-medium">เหรียญ</th>
                <th className="px-6 py-4 font-medium">จำนวน</th>
                <th className="px-6 py-4 font-medium">ราคา</th>
                <th className="px-6 py-4 font-medium">มูลค่า</th>
                <th className="px-6 py-4 font-medium">ผู้ใช้</th>
                <th className="px-6 py-4 font-medium">สถานะ</th>
                <th className="px-6 py-4 font-medium">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-mono text-sm">{tx.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.type === "buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {tx.type === "buy" ? "ซื้อ" : "ขาย"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{tx.coin}</td>
                  <td className="px-6 py-4">{tx.amount}</td>
                  <td className="px-6 py-4">${tx.price.toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">${tx.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{tx.user}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === "completed" ? "bg-green-500/20 text-green-400" :
                      tx.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {tx.status === "completed" ? "สำเร็จ" : tx.status === "pending" ? "รอดำเนินการ" : "ล้มเหลว"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
