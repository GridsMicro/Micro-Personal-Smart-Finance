"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, ArrowLeft, Search, Shield, MoreVertical, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  emailVerified: string | null;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/admin" className="p-2 hover:bg-slate-800 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-white">ผู้ใช้งาน</h1>
                <p className="text-sm text-slate-500">จัดการผู้ใช้งานและสิทธิ์</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">SuperAdmin</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้งาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-neon-cyan focus:outline-none"
          />
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
            <span className="ml-3 text-slate-400">กำลังโหลดข้อมูล...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
            >
              ลองใหม่
            </button>
          </div>
        ) : (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-6 py-4 font-medium">ผู้ใช้งาน</th>
                <th className="px-6 py-4 font-medium">บทบาท</th>
                <th className="px-6 py-4 font-medium">สถานะ</th>
                <th className="px-6 py-4 font-medium">สร้างเมื่อ</th>
                <th className="px-6 py-4 font-medium">เข้าสู่ระบบล่าสุด</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 flex items-center justify-center">
                        <Users className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === "superadmin" ? "bg-red-500/20 text-red-400" :
                      user.role === "admin" ? "bg-blue-500/20 text-blue-400" :
                      "bg-slate-700 text-slate-300"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {user.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("th-TH") : "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {user.emailVerified ? new Date(user.emailVerified).toLocaleDateString("th-TH") : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-slate-800 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-10 text-slate-500">
              ไม่พบผู้ใช้งาน
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}
