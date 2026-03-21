"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getTransactions,
  saveTransaction,
  deleteTransaction,
} from "./actions/transactionActions";

const FIAT_CURRENCIES = [
  { symbol: "฿", code: "THB", name: "Thai Baht" },
  { symbol: "$", code: "USD", name: "US Dollar" },
];

const SUPPORTED_ASSETS = ["BTC", "ETH", "SOL", "USDT"];
const ASSET_LOGOS: Record<string, string> = {
  BTC: "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg",
  ETH: "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg",
  SOL: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
  USDT: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Tether_Logo.svg",
};

export default function Home() {
  const { data: session } = useSession();
  const [baseFiat, setBaseFiat] = useState(FIAT_CURRENCIES[0]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pricesUSD, setPricesUSD] = useState<Record<string, number>>({
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDT: 1,
  });
  const [exchangeRateUSDTHB, setExchangeRateUSDTHB] = useState<number>(35);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [inputType, setInputType] = useState<string>("DEPOSIT");
  const [inputAsset, setInputAsset] = useState("BTC");
  const [inputAmount, setInputAmount] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [inputDate, setInputDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [editingTxId, setEditingTxId] = useState<number | null>(null);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      const data = await getTransactions();
      setTransactions(data);
    };
    if (session) loadData();
  }, [session]);

  // Fetch Exchange Rate & Prices
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data?.rates?.THB) setExchangeRateUSDTHB(data.rates.THB);
      } catch (e) {}
    };
    fetchRates();

    const fetchPrices = async () => {
      try {
        setIsUpdating(true);
        const symbols = '["BTCUSDT","ETHUSDT","SOLUSDT"]';
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`
        );
        const data = await res.json();
        const newPrices: Record<string, number> = { USDT: 1 };
        data.forEach((item: any) => {
          newPrices[item.symbol.replace("USDT", "")] = parseFloat(item.price);
        });
        setPricesUSD(newPrices);
        setIsUpdating(false);
      } catch (e) {
        setIsUpdating(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAssetValueInFiat = (asset: string, amount: number) => {
    const priceInUSD = pricesUSD[asset] || 0;
    const valueInUSD = amount * priceInUSD;
    return baseFiat.code === "THB" ? valueInUSD * exchangeRateUSDTHB : valueInUSD;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAmount || Number(inputAmount) <= 0) return;

    setIsSaving(true);
    try {
      await saveTransaction({
        id: editingTxId || undefined,
        asset: inputAsset,
        amount: inputAmount,
        type: inputType,
        note: inputNote,
        date: inputDate,
      });
      // Reload Transactions
      const data = await getTransactions();
      setTransactions(data);
      
      // Reset Form
      setEditingTxId(null);
      setInputAmount("");
      setInputNote("");
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter((tx) => tx.id !== id));
    } catch (e) {
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

  const portfolio = transactions.reduce((acc, tx) => {
    const amount = parseFloat(tx.amount);
    if (!acc[tx.asset]) acc[tx.asset] = 0;
    if (tx.type === "DEPOSIT") acc[tx.asset] += amount;
    else acc[tx.asset] -= amount;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = Object.entries(portfolio).reduce((total, [asset, amount]) => {
    return total + getAssetValueInFiat(asset, amount as number);
  }, 0);

  const monthlyDataMap = transactions.reduce((acc, tx) => {
    const month = tx.date.substring(0, 7);
    if (!acc[month]) acc[month] = { month, "ซื้อสะสม": 0, "ขายออก": 0 };
    const value = getAssetValueInFiat(tx.asset, parseFloat(tx.amount));
    if (tx.type === "DEPOSIT") acc[month]["ซื้อสะสม"] += value;
    else acc[month]["ขายออก"] += value;
    return acc;
  }, {} as Record<string, any>);
  const monthlyData = Object.keys(monthlyDataMap).sort().map(k => monthlyDataMap[k]);

  return (
    <div className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-gray-50 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <img src={session.user.image} className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5 shadow-md" alt="User" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Smart Planner
              {isUpdating && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              สวัสดีคุณ {session?.user?.name || "นักลงทุน"} 👋 แดชบอร์ดข้อมูลจริง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={baseFiat.code}
            onChange={(e) => {
              const selected = FIAT_CURRENCIES.find((c) => c.code === e.target.value);
              if (selected) setBaseFiat(selected);
            }}
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 font-bold focus:outline-none shadow-sm cursor-pointer"
          >
            {FIAT_CURRENCIES.map(fiat => (
              <option key={fiat.code} value={fiat.code}>{fiat.code} ({fiat.symbol})</option>
            ))}
          </select>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚪</span> ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg text-white">
            <h2 className="text-blue-100 text-sm font-medium">มูลค่าพอร์ตรวมจริง</h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{baseFiat.symbol}</span>
              <span className="text-4xl font-bold transition-opacity">
                {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
              {editingTxId ? "แก้ไขรายการ ✏️" : "บันทึกพอร์ต 📝"}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button type="button" onClick={() => setInputType("DEPOSIT")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${inputType === "DEPOSIT" ? "bg-white dark:bg-zinc-700 shadow-sm text-green-600" : "text-gray-500"}`}>ซื้อ/ฝาก</button>
                <button type="button" onClick={() => setInputType("WITHDRAW")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${inputType === "WITHDRAW" ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-gray-500"}`}>ขาย/ถอน</button>
              </div>
              <select value={inputAsset} onChange={(e) => setInputAsset(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 outline-none">
                {SUPPORTED_ASSETS.map((coin) => (
                  <option key={coin} value={coin}>{coin} (${pricesUSD[coin]?.toLocaleString()})</option>
                ))}
              </select>
              <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 outline-none" />
              <input type="number" step="0.00000001" placeholder="จำนวนเหรียญ" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 outline-none" />
              <input type="text" placeholder="หมายเหตุ" value={inputNote} onChange={(e) => setInputNote(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 outline-none" />
              <button type="submit" disabled={isSaving}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${editingTxId ? "bg-amber-500" : "bg-gray-900 dark:bg-white dark:text-zinc-950"} disabled:opacity-50`}>
                {isSaving ? "กำลังบันทึก..." : (editingTxId ? "อัปเดตข้อมูล" : "บันทึกลงพอร์ต")}
              </button>
              {editingTxId && <button type="button" onClick={() => { setEditingTxId(null); setInputAmount(""); }} className="text-sm font-bold text-gray-500 hover:text-gray-700 mt-1">ยกเลิก</button>}
            </form>
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
             <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">สินทรัพย์ที่ถือครองจริง</h2>
             {Object.keys(portfolio).length === 0 ? (
               <p className="text-gray-500 text-center py-8">ยังไม่มีเหรียญในพอร์ต... ลองบันทึกดูสิ! ✨</p>
             ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(portfolio).map(([asset, amount]) => {
                    const amt = amount as number;
                    if (amt <= 0) return null;
                    const val = getAssetValueInFiat(asset, amt);
                    return (
                      <div key={asset} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={ASSET_LOGOS[asset]} alt={asset} className="w-8 h-8 object-contain" />
                          <p className="font-semibold text-gray-900 dark:text-white">{amt.toLocaleString()} {asset}</p>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {baseFiat.symbol}{val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )
                  })}
                </div>
             )}
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
             <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">ประวัติจากฐานข้อมูล (Neon DB)</h2>
             <div className="flex flex-col gap-2">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 text-sm">
                    <div className="flex flex-col">
                      <span className={`font-bold ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "DEPOSIT" ? "+" : "-"}{parseFloat(tx.amount).toLocaleString()} {tx.asset}
                      </span>
                      <span className="text-xs text-gray-500">{tx.date} • {tx.note || "ไม่มีหมายเหตุ"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingTxId(tx.id);
                        setInputType(tx.type);
                        setInputAsset(tx.asset);
                        setInputAmount(tx.amount);
                        setInputNote(tx.note || "");
                        setInputDate(tx.date);
                      }} className="text-xs font-bold text-blue-500">แก้</button>
                      <button onClick={() => handleDelete(tx.id)} className="text-xs font-bold text-red-500">ลบ</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
