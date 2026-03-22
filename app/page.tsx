"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

// Official Partner Logos
const PartnerLogos = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 items-center justify-items-center opacity-60">
    <a href="https://www.binance.th/th" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100">
       <img src="/coins/BINANCE-EX.png" className="h-5 object-contain" alt="binance-th" />
       <span className="font-extrabold text-[10px] tracking-tighter text-white">Binance <span className="text-[#F3BA2F]">TH</span></span>
    </a>
    <a href="https://www.bitkub.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100">
       <img src="/coins/BITKUB-EX.png" className="h-5 object-contain" alt="bitkub" />
       <span className="font-black text-[10px] tracking-tighter text-[#00E08F]">Bitkub</span>
    </a>
    <a href="https://www.okx.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100">
       <img src="/coins/OKX_logo.svg.png" className="h-5 object-contain brightness-200 contrast-200" alt="okx" />
       <span className="font-black text-[10px] tracking-tighter text-white">OKX GLOBAL</span>
    </a>
    <a href="https://coinmarketcap.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100">
       <div className="w-5 h-5 bg-[#3861fb] rounded-full flex items-center justify-center text-[8px] font-bold">M</div>
       <span className="font-black text-[10px] tracking-tighter text-white">CoinMarketCap</span>
    </a>
    <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100">
       <div className="w-5 h-5 bg-[#8cc63f] rounded-full flex items-center justify-center text-[8px] font-bold">G</div>
       <span className="font-black text-[10px] tracking-tighter text-white">CoinGecko</span>
    </a>
  </div>
);

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#27272a] text-white font-sans selection:bg-blue-600/30 overflow-x-hidden">
      
      {/* 🚀 Header Area */}
      <nav className="h-24 px-8 max-w-[1400px] mx-auto flex justify-between items-center border-b border-white/5 bg-[#27272a]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black text-xl shadow-2xl transition-transform group-hover:scale-110">SP</div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase leading-none">SMART PLANNER</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 ml-0.5">Automated Finance</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-10">
          <Link href="/market" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-all">Live Market</Link>
          {session ? (
            <Link href="/dashboard" className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-white/10">Launch Dashboard</Link>
          ) : (
            <Link href="/login" className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-white/10">Sign In (Login)</Link>
          )}
        </div>
      </nav>

      {/* 🔮 Hero Section (Visionary) */}
      <section className="relative px-6 py-32 flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[150px] -z-10 rounded-full"></div>
        <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black tracking-widest uppercase text-blue-400 mb-8 animate-pulse shadow-2xl">⚡ Next-Gen Asset Management Node</div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter max-w-[1000px] mb-8 leading-[0.95]">
           ปฏิวัติอนาคต<br /><span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">การวางแผนอัจฉริยะ</span>
        </h1>
        
        <p className="text-zinc-500 text-lg md:text-xl font-bold max-w-[700px] mb-12 tracking-tight">
          ระบบบริหารจัดการสินทรัพย์ดิจิทัลระดับสูงที่ให้คุณครอบคลุมทุกการเคลื่อนไหวของพอร์ตโฟลิโอ 
          ด้วยระบบ Smart Autopilot และแม่นยำที่สุดผ่าน Smart Planner
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mb-20 scale-110">
          <Link href="/dashboard" className="px-10 py-5 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 transition-all border-t border-white/20">
             เริ่มต้นใช้งานตอนนี้ 🚀
          </Link>
          <Link href="/market" className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3 group">
             ดูความเคลื่อนไหวตลาด <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* 📊 Feature Teaser */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto mt-20">
          {[
            { title: "24/7 TRACKING", sub: "ตรวจสอบสินทรัพย์ทั่วโลกแบบเรียลไทม์ ตลอด 24 ชั่วโมง ไม่มีหยุดพัก" },
            { title: "MULTI-EXCHANGE", sub: "รวมศูนย์ข้อมูลจาก Binance TH, Bitkub และ OKX ไว้ในหน้าจอเดียว" },
            { title: "DCA SIMULATOR", sub: "จำลองการลงทุนแบบอัตโนมัติ เพื่อวางแผนอนาคตที่มั่นคงและแม่นยำ" }
          ].map(f => (
            <div key={f.title} className="p-10 bg-white/5 border border-white/5 rounded-[3rem] text-left hover:bg-white/[0.07] transition-all group">
               <div className="w-12 h-1 text-blue-500 bg-blue-500 mb-6 transition-all group-hover:w-full opacity-60"></div>
               <h4 className="text-[12px] font-black tracking-[0.5em] text-white/40 mb-3">{f.title}</h4>
               <p className="text-lg font-bold text-white tracking-tight leading-snug">{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🏁 Footer Area */}
      <footer className="mt-40 border-t border-white/5 py-24 px-6 bg-black/10">
         <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-12">
            <div className="text-center">
               <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-10">Trusted Global Data Partners</h3>
               <PartnerLogos />
            </div>
            <div className="h-px w-20 bg-white/10"></div>
            <div className="flex flex-col items-center gap-4 opacity-40">
               <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  <Link href="/dashboard" className="hover:text-white">Privacy Policy</Link>
                  <Link href="/market" className="hover:text-white">Terms of Service</Link>
                  <a href="https://github.com/GridsMicro" className="hover:text-white">Contact Node</a>
               </div>
               <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mt-4">© 2026 SMART PLANNER • DESIGNED FOR THE ELITE EXPLORER</p>
            </div>
         </div>
      </footer>

      {/* 🌊 Background Noise/Texture (Subtle) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-dark.png')]"></div>
    </div>
  );
}
