"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// สกุลเงินหลักสำหรับเทียบมูลค่า (Fiat)
const FIAT_CURRENCIES = [
  { symbol: "฿", code: "THB", name: "Thai Baht" },
  { symbol: "$", code: "USD", name: "US Dollar" },
];

const SUPPORTED_ASSETS = ["BTC", "ETH", "SOL", "USDT"];

// ลิงก์รูปภาพโลโก้เหรียญจาก Wikipedia / แหล่งข้อมูลสาธารณะ
const ASSET_LOGOS: Record<string, string> = {
  BTC: "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg",
  ETH: "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg",
  SOL: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
  USDT: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Tether_Logo.svg",
};

type Transaction = {
  id: number;
  asset: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW";
  note: string;
  date: string;
};

export default function Home() {
  const [baseFiat, setBaseFiat] = useState(FIAT_CURRENCIES[0]); // สกุลเงินแสดงผลหลัก (เริ่มที่ THB)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // State เก็บราคาจาก Binance
  const [pricesUSD, setPricesUSD] = useState<Record<string, number>>({
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDT: 1, // Stablecoin ให้ค่าอ้างอิงเป็น 1 USD
  });
  const [exchangeRateUSDTHB, setExchangeRateUSDTHB] = useState<number>(35); // เริ่มต้นที่ 35
  const [isUpdating, setIsUpdating] = useState(false);

  // States สำหรับฟอร์มกรอกข้อมูล
  const [inputType, setInputType] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
  const [inputAsset, setInputAsset] = useState("BTC");
  const [inputAmount, setInputAmount] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [inputDate, setInputDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);

  // ดึงอัตราแลกเปลี่ยน USD/THB ทำแค่ครั้งเดียวตอนโหลด หรือนานๆ ครั้ง (เช่น ทุก 1 ชั่วโมง)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        // ใช้ API ฟรีสำหรับอัตราแลกเปลี่ยน (exchangerate-api.com)
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data && data.rates && data.rates.THB) {
          setExchangeRateUSDTHB(data.rates.THB);
        }
      } catch (error) {
        console.error("Failed to fetch USD/THB exchange rate:", error);
      }
    };
    fetchExchangeRate();
  }, []);

  // ระบบดึงราคาจาก Binance แบบ Real-time
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsUpdating(true);
        // ขอราคาจาก Binance API โดยตรง
        const symbols = '["BTCUSDT","ETHUSDT","SOLUSDT"]'; 
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`);
        const data = await res.json();
        
        const newPrices: Record<string, number> = { USDT: 1 };
        data.forEach((item: { symbol: string, price: string }) => {
          // ตัดคำว่า USDT ด้านหลังออก เพื่อให้เหลือแต่ชื่อเหรียญ (เช่น BTCUSDT -> BTC)
          const assetName = item.symbol.replace("USDT", "");
          newPrices[assetName] = parseFloat(item.price);
        });

        setPricesUSD(newPrices);
        setIsUpdating(false);
      } catch (error) {
        console.error("Failed to fetch Binance prices:", error);
        setIsUpdating(false);
      }
    };

    fetchPrices(); // ดึงครั้งแรกทันทีที่เปิดเว็บ
    
    // ตั้งให้ดึงราคาใหม่ โหลดอัปเดตทุกๆ 5 วินาที!
    const intervalId = setInterval(fetchPrices, 5000);
    return () => clearInterval(intervalId); // ทำลายหลัง Component ปิด
  }, []);

  // ฟังก์ชันคำนวณราคาสินทรัพย์ (Asset) ให้เป็น Fiat (THB หรือ USD)
  const getAssetValueInFiat = (asset: string, amount: number) => {
    const priceInUSD = pricesUSD[asset] || 0;
    const valueInUSD = amount * priceInUSD;
    
    if (baseFiat.code === "THB") {
      return valueInUSD * exchangeRateUSDTHB;
    }
    return valueInUSD;
  };

  // รวมรายการทรัพย์สินที่ถือครอง (Portfolio Balance)
  const portfolio = transactions.reduce((acc, tx) => {
    if (!acc[tx.asset]) acc[tx.asset] = 0;
    if (tx.type === "DEPOSIT") acc[tx.asset] += tx.amount;
    if (tx.type === "WITHDRAW") acc[tx.asset] -= tx.amount;
    return acc;
  }, {} as Record<string, number>);

  // คำนวณมูลค่ารวมทั้งพอร์ต (Total Value)
  const totalValueInFiat = Object.entries(portfolio).reduce((total, [asset, amount]) => {
    return total + getAssetValueInFiat(asset, amount);
  }, 0);

  // คำนวณกราฟสรุปรายเดือน (Monthly Summary)
  const monthlyDataMap = transactions.reduce((acc, tx) => {
    const month = tx.date ? tx.date.substring(0, 7) : new Date(tx.id).toISOString().substring(0, 7);
    if (!acc[month]) acc[month] = { month, "ซื้อสะสม (Deposit)": 0, "ขายออก (Withdraw)": 0 };
    
    // คำนวณค่าเป็น Fiat ณ ตอนนี้
    const value = getAssetValueInFiat(tx.asset, tx.amount);
    if (tx.type === "DEPOSIT") acc[month]["ซื้อสะสม (Deposit)"] += value;
    if (tx.type === "WITHDRAW") acc[month]["ขายออก (Withdraw)"] += value;
    
    return acc;
  }, {} as Record<string, { month: string, "ซื้อสะสม (Deposit)": number, "ขายออก (Withdraw)": number }>);
  const monthlyData = Object.keys(monthlyDataMap).sort().map(k => monthlyDataMap[k]);

  // ฟังก์ชันสําหรับเพิ่ม/แก้ไข Transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAmount || Number(inputAmount) <= 0) return;

    if (editingTxId) {
      setTransactions(transactions.map(tx => tx.id === editingTxId ? { ...tx, asset: inputAsset, amount: Number(inputAmount), type: inputType, note: inputNote, date: inputDate } : tx));
      setEditingTxId(null);
    } else {
      const newTx: Transaction = {
        id: Date.now(),
        asset: inputAsset,
        amount: Number(inputAmount),
        type: inputType,
        note: inputNote,
        date: inputDate,
      };
      setTransactions([newTx, ...transactions]);
    }
    
    setInputAmount("");
    setInputNote("");
  };

  // ฟังก์ชันแก้ไข
  const handleEditClick = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setInputType(tx.type);
    setInputAsset(tx.asset);
    setInputAmount(tx.amount.toString());
    setInputNote(tx.note || "");
    setInputDate(tx.date || new Date().toISOString().split("T")[0]);
  };

  // ฟังก์ชันลบ
  const handleDeleteClick = (id: number) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
    if (editingTxId === id) {
      setEditingTxId(null);
      setInputAmount("");
      setInputNote("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-gray-50 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Smart Planner ฿₿ 
            {isUpdating && <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
            พอร์ตจำลอง: อัปเดตราคาแบบ Real-time จาก Binance
          </p>
        </div>

        {/* เลือกสกุลเงินสำหรับแสดงมูลค่า */}
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
          <label htmlFor="fiat" className="text-sm font-medium text-gray-600 dark:text-gray-300">
            แสดงมูลค่าพอร์ตสกุลเงิน:
          </label>
          <select
            id="fiat"
            value={baseFiat.code}
            onChange={(e) => {
              const selected = FIAT_CURRENCIES.find((c) => c.code === e.target.value);
              if (selected) setBaseFiat(selected);
            }}
            className="p-1.5 border-none bg-transparent text-gray-900 dark:text-white focus:outline-none font-bold cursor-pointer"
          >
            {FIAT_CURRENCIES.map(fiat => (
              <option key={fiat.code} value={fiat.code}>{fiat.code} ({fiat.symbol})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- ฝั่งซ้าย: สรุปพอร์ตและฟอร์มกรอก --- */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* มูลค่ารวม */}
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-blue-100 text-sm font-medium">มูลค่าพอร์ตรวม (Total Value)</h2>
              <span className="text-xs px-2 py-1 bg-white/20 rounded-md font-mono">LIVE API</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{baseFiat.symbol}</span>
              <span className={`text-4xl font-bold ${isUpdating ? 'opacity-80' : 'opacity-100'} transition-opacity`}>
                {totalValueInFiat.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Form กรอกจำนวนสินทรัพย์ */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
              {editingTxId ? "แก้ไขรายการ (Edit Transaction)" : "เพิ่มรายการ (Add Transaction)"}
            </h2>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
              
              {/* สลับ ซื้อ/ขาย */}
              <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputType("DEPOSIT")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                    inputType === "DEPOSIT" ? "bg-white dark:bg-zinc-700 shadow-sm text-green-600" : "text-gray-500"
                  }`}
                >
                  <span className="mr-1">📥</span> ซื้อ/ฝาก (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => setInputType("WITHDRAW")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                    inputType === "WITHDRAW" ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-gray-500"
                  }`}
                >
                  <span className="mr-1">📤</span> ขาย/ถอน (Sell)
                </button>
              </div>
              
              <div>
                <label className="block text-sm text-gray-500 mb-1">เหรียญ (Asset)</label>
                <select 
                  value={inputAsset}
                  onChange={(e) => setInputAsset(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {SUPPORTED_ASSETS.map((coin) => (
                    <option key={coin} value={coin}>{coin} (ตลาด: ${pricesUSD[coin]?.toLocaleString("en-US", { maximumFractionDigits: 2 })})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">วันที่ (Date)</label>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">จำนวนเหรียญ (Amount)</label>
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="เช่น 0.05"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">หมายเหตุ (Note)</label>
                <input
                  type="text"
                  placeholder="เช่น เก็บเงินเดือน ม.ค."
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button 
                type="submit"
                className={`w-full py-3 text-white dark:text-black font-semibold rounded-lg transition-colors mt-2 ${
                  editingTxId 
                    ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500" 
                    : "bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200"
                }`}
              >
                {editingTxId ? "บันทึกการแก้ไข (Update)" : "บันทึกบัญชี (+ เพิ่มลงพอร์ต)"}
              </button>

              {editingTxId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingTxId(null);
                    setInputAmount("");
                  }}
                  className="w-full py-3 bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors mt-1"
                >
                  ยกเลิก (Cancel)
                </button>
              )}
            </form>
          </div>
        </div>

        {/* --- ฝั่งขวา: รายละเอียดเหรียญในพอร์ตและประวัติ --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* ข้อมูลเหรียญรายตัว (Holdings) */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
             <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">สินทรัพย์ที่ถือครอง (Your Assets)</h2>
             {Object.keys(portfolio).length === 0 ? (
               <p className="text-gray-500 text-center py-8">ยังไม่มีเหรียญในพอร์ต... ลองเพิ่มสินทรัพย์ดูสิ!</p>
             ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(portfolio).map(([asset, amount]) => {
                    if (amount <= 0) return null;
                    const valueInFiat = getAssetValueInFiat(asset, amount);
                    const currentPriceFiat = asset === "USDT" ? 1 * (baseFiat.code === "THB" ? exchangeRateUSDTHB : 1) : getAssetValueInFiat(asset, 1);
                    return (
                      <div key={asset} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-white rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 shadow-sm shrink-0">
                            <img src={ASSET_LOGOS[asset]} alt={asset} className="w-6 h-6 object-contain" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{amount} {asset}</p>
                            <div className="flex gap-2 items-center">
                              <p className="text-xs text-gray-500">
                                ราคาตลาด: {baseFiat.symbol}{currentPriceFiat.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                              </p>
                              {isUpdating && <span className="text-[10px] text-green-500 animate-pulse">(Live)</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-gray-900 dark:text-white ${isUpdating ? 'opacity-80' : 'opacity-100'} transition-opacity`}>
                            {baseFiat.symbol}{valueInFiat.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
             )}
          </div>

          {/* กราฟสรุปรายเดือน */}
          {monthlyData.length > 0 && (
            <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
               <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">สรุปการลงทุน (Monthly Bar Chart - {baseFiat.code})</h2>
               <div className="h-64 w-full text-sm">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis dataKey="month" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                     <YAxis tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toLocaleString()}`} />
                     <Tooltip 
                       formatter={(value: number) => [`${baseFiat.symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, undefined]}
                       cursor={{ fill: '#F3F4F6' }}
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Legend iconType="circle" />
                     <Bar dataKey="ซื้อสะสม (Deposit)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="ขายออก (Withdraw)" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          )}

          {/* ประวัติการลงบัญชีล่าสุด */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
             <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">ประวัติการบันทึก (Recent Transactions)</h2>
             {transactions.length === 0 ? (
               <p className="text-gray-500 text-sm">ยังไม่มีประวัติการทำรายการ</p>
             ) : (
               <div className="flex flex-col gap-2">
                 {transactions.map(tx => (
                   <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 text-sm">
                     <div className="flex items-start gap-3">
                       <img src={ASSET_LOGOS[tx.asset]} alt={tx.asset} className="w-8 h-8 object-contain shrink-0 mt-1" />
                       <div className="flex flex-col">
                         <span className={`font-medium text-base ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-500"}`}>
                           {tx.type === "DEPOSIT" ? "+" : "-"}{tx.amount} {tx.asset}
                         </span>
                         <span className="text-xs text-gray-500 mt-0.5">
                           {tx.date} {tx.note && <span className="text-gray-400 font-medium"> • {tx.note}</span>}
                         </span>
                       </div>
                     </div>
                     <div className="flex gap-2 items-center">
                       <button onClick={() => handleEditClick(tx)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">แก้ไข</button>
                       <button onClick={() => handleDeleteClick(tx.id)} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">ลบ</button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
