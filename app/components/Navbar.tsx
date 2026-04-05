"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export default function Navbar({ isDaily = false }: { isDaily?: boolean }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#2B35AF]/80 backdrop-blur-xl h-20 no-print">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex justify-between items-center gap-8">
         <div className="flex items-center gap-5 group cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(8,145,178,0.4)] border border-cyan-500/20 overflow-hidden relative">
               <img src="/logo.png" className="w-[85%] h-[85%] object-contain relative z-10" alt="LOGO" />
               <div className="absolute inset-0 bg-cyan-500/10 blur-xl"></div>
            </div>
            <div className="flex flex-col">
               <h1 className="font-black text-2xl tracking-[0.05em] uppercase leading-none text-white italic">SMART PLANNER</h1>
               <p className="text-[9px] text-zinc-500 font-black tracking-[0.2em] uppercase mt-2 opacity-60">AUTOMATED ASSET MANAGEMENT</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3">
            {!isDaily ? (
               <button 
                  onClick={() => router.push("/daily")} 
                  className="px-5 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-xl"
               >
                  Audit Terminal 📊
               </button>
            ) : (
               <button 
                  onClick={() => router.push("/dashboard")} 
                  className="px-5 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-xl"
               >
                  Back to Index ⎌
               </button>
            )}
            <button 
               onClick={() => router.push("/api-test")} 
               className="px-5 py-3 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neon-cyan hover:text-black transition-all shadow-xl"
            >
               API Compare 🔌
            </button>
            <button 
               onClick={() => router.push("/profile")} 
               className="px-5 py-3 bg-purple-600/10 border border-purple-500/30 text-purple-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all shadow-xl flex items-center gap-2"
            >
               <User className="w-4 h-4" />
               Profile
            </button>
            <button 
               onClick={() => signOut()} 
               className="px-5 py-3 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg"
            >
               Exit 🚪
            </button>
         </div>
      </div>
    </header>
  );
}
