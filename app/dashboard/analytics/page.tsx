"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// --- Types ---
interface TrendData {
  date: string;
  totalValue: number;
  holdings: Record<string, number>;
}

interface TrendStats {
  startValue: number;
  endValue: number;
  maxValue: number;
  minValue: number;
  change: number;
  changePercent: number;
}

interface CoinData {
  asset: string;
  totalValue: number;
  avgPrice: number;
  latestAmount: number;
}

interface Portfolio {
  id: number;
  name: string;
  exchangeType: string | null;
}

// --- Scalability Config ---
// Limit แสดง top assets ที่มีมูลค่าสูงสุด ถ้ามีเยอะเกินไป
const MAX_ASSETS_IN_PIE = 10;
const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6", "#F97316", "#84CC16"];

// --- Components ---
export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  
  // Filters
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");
  const [days, setDays] = useState(30);

  // Fetch trends data
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchTrends = async () => {
      try {
        const res = await fetch(`/api/analytics/trends?days=${days}`);
        if (!res.ok) throw new Error("Failed to fetch trends");
        const data = await res.json();
        setTrends(data.trends);
        setTrendStats(data.stats);
      } catch (err) {
        console.error("Trends error:", err);
        setError("Failed to load trend data");
      }
    };

    fetchTrends();
  }, [session, days]);

  // Fetch coins data
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchCoins = async () => {
      try {
        const params = new URLSearchParams();
        params.append("days", days.toString());
        if (selectedPortfolio) params.append("portfolioId", selectedPortfolio);
        
        const res = await fetch(`/api/analytics/coins?${params}`);
        if (!res.ok) throw new Error("Failed to fetch coins");
        const data = await res.json();
        setCoins(data.stats?.byAsset || []);
        setPortfolios(data.portfolios || []);
      } catch (err) {
        console.error("Coins error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [session, days, selectedPortfolio]);

  // Prepare pie chart data (top assets only)
  const pieData = coins
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, MAX_ASSETS_IN_PIE)
    .map((coin) => ({
      name: coin.asset,
      value: coin.totalValue,
    }));

  // Calculate "others" if there are more assets
  const otherAssets = coins.slice(MAX_ASSETS_IN_PIE);
  if (otherAssets.length > 0) {
    const othersValue = otherAssets.reduce((sum, c) => sum + c.totalValue, 0);
    pieData.push({ name: `Others (${otherAssets.length})`, value: othersValue });
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">กรุณาเข้าสู่ระบบ</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Analytics Dashboard
            </span>
          </h1>
          <p className="text-gray-400">
            วิเคราะห์แนวโน้มและประสิทธิภาพพอร์ตการลงทุน
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a2e]/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* Date Range */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">ช่วงเวลา</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-[#0a0a0f] border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={7}>7 วัน</option>
                <option value={30}>30 วัน</option>
                <option value={90}>3 เดือน</option>
                <option value={180}>6 เดือน</option>
                <option value={365}>1 ปี</option>
              </select>
            </div>

            {/* Portfolio Filter */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">พอร์ต</label>
              <select
                value={selectedPortfolio}
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                className="bg-[#0a0a0f] border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {trendStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              title="มูลค่าปัจจุบัน"
              value={`฿${trendStats.endValue.toLocaleString()}`}
              color="blue"
            />
            <StatCard
              title="การเปลี่ยนแปลง"
              value={`${trendStats.change >= 0 ? "+" : ""}฿${trendStats.change.toLocaleString()}`}
              subValue={`${trendStats.changePercent >= 0 ? "+" : ""}${trendStats.changePercent.toFixed(2)}%`}
              color={trendStats.change >= 0 ? "green" : "red"}
            />
            <StatCard
              title="สูงสุด"
              value={`฿${trendStats.maxValue.toLocaleString()}`}
              color="purple"
            />
            <StatCard
              title="ต่ำสุด"
              value={`฿${trendStats.minValue.toLocaleString()}`}
              color="orange"
            />
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-[#1a1a2e]/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              📈 แนวโน้มมูลค่ารวม
            </h3>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tickFormatter={(date) => new Date(date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [`฿${value.toLocaleString()}`, "มูลค่า"]
                    }
                    labelFormatter={(date) => new Date(date).toLocaleDateString("th-TH")}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#3B82F6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                ไม่มีข้อมูลสำหรับช่วงเวลานี้
              </div>
            )}
          </motion.div>

          {/* Asset Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1a1a2e]/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              🥧 สัดส่วนสินทรัพย์
              {coins.length > MAX_ASSETS_IN_PIE && (
                <span className="text-sm text-gray-400 ml-2">
                  (แสดง {MAX_ASSETS_IN_PIE} อันดับแรก)
                </span>
              )}
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number, name: string) => [
                      `฿${value.toLocaleString()}`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                ไม่มีข้อมูลสินทรัพย์
              </div>
            )}
          </motion.div>

          {/* Top Assets Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#1a1a2e]/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              💰 มูลค่าตามเหรียญ
            </h3>
            {coins.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={coins.slice(0, MAX_ASSETS_IN_PIE)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="asset"
                    stroke="#6b7280"
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [
                      `฿${value.toLocaleString()}`,
                      "มูลค่า",
                    ]}
                  />
                  <Bar dataKey="totalValue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                ไม่มีข้อมูลเหรียญ
              </div>
            )}
          </motion.div>
        </div>

        {/* Asset Details Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-[#1a1a2e]/50 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            📋 รายละเอียดสินทรัพย์ ({coins.length} เหรียญ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">เหรียญ</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">ปริมาณ</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">ราคาเฉลี่ย</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">มูลค่า</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin) => (
                  <tr
                    key={coin.asset}
                    className="border-b border-blue-500/10 hover:bg-blue-500/5"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {coin.asset}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      {coin.latestAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      ฿{coin.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400 font-medium">
                      ฿{coin.totalValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- Sub Components ---
function StatCard({
  title,
  value,
  subValue,
  color,
}: {
  title: string;
  value: string;
  subValue?: string;
  color: "blue" | "green" | "red" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-transparent border-blue-500/30",
    green: "from-green-500/20 to-transparent border-green-500/30",
    red: "from-red-500/20 to-transparent border-red-500/30",
    purple: "from-purple-500/20 to-transparent border-purple-500/30",
    orange: "from-orange-500/20 to-transparent border-orange-500/30",
  };

  const textColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    red: "text-red-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-4`}
    >
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {subValue && (
        <p className={`text-sm mt-1 ${textColors[color]}`}>{subValue}</p>
      )}
    </div>
  );
}
