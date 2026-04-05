"use client";

/**
 * DashboardSkeleton - Cyberpunk Loading State
 * 
 * Neon glow effects with glass morphism placeholder
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200 pb-20 overflow-x-hidden grid-cyber">
      {/* Header Skeleton */}
      <nav className="h-24 px-8 max-w-400 mx-auto flex justify-between items-center border-b border-neon-cyan/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50 animate-pulse border border-neon-cyan/20" />
          <div className="space-y-2">
            <div className="w-32 h-6 bg-slate-800/50 rounded animate-pulse" />
            <div className="w-24 h-3 bg-slate-800/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-10">
          <div className="w-24 h-4 bg-slate-800/30 rounded animate-pulse" />
          <div className="w-32 h-10 bg-slate-800/50 rounded-xl animate-pulse border border-neon-cyan/10" />
        </div>
      </nav>

      <main className="max-w-400 mx-auto px-6 py-10 flex flex-col gap-12">
        {/* Loading Status */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900/50 border border-neon-cyan/20">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-neon-cyan font-mono text-sm tracking-widest animate-pulse">
              INITIALIZING NEURAL LINK...
            </span>
          </div>
        </div>

        {/* Portfolio Cards Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="p-6 rounded-3xl border border-neon-cyan/10 bg-slate-900/40 min-h-35 flex flex-col justify-center gap-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 animate-pulse border border-neon-cyan/10" />
                <div className="w-24 h-4 bg-slate-800/50 rounded animate-pulse" />
              </div>
              <div className="w-32 h-8 bg-slate-800/30 rounded animate-pulse" />
              <div className="w-20 h-3 bg-slate-800/20 rounded animate-pulse" />
            </div>
          ))}
        </section>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Chart & Table Skeleton */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Chart Skeleton */}
            <div className="bg-slate-900/60 border border-neon-cyan/10 rounded-4xl p-10 h-105 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="w-48 h-6 bg-slate-800/50 rounded animate-pulse" />
                <div className="w-24 h-4 bg-slate-800/30 rounded animate-pulse" />
              </div>
              <div className="h-75 bg-linear-to-b from-slate-800/30 to-transparent rounded-2xl animate-pulse border border-neon-cyan/5" />
            </div>

            {/* Table Skeleton */}
            <div className="bg-slate-900/40 border border-neon-cyan/10 rounded-4xl overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-neon-cyan/10 bg-slate-900/30">
                <div className="w-40 h-4 bg-slate-800/50 rounded animate-pulse" />
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-4 px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 animate-pulse border border-neon-cyan/10" />
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-slate-800/50 rounded animate-pulse" />
                      <div className="w-16 h-3 bg-slate-800/30 rounded animate-pulse" />
                    </div>
                    <div className="w-20 h-4 bg-slate-800/30 rounded animate-pulse" />
                    <div className="w-16 h-4 bg-slate-800/20 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/60 border border-neon-cyan/10 rounded-4xl p-10 space-y-10 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="w-32 h-3 bg-slate-800/30 rounded animate-pulse" />
                <div className="w-48 h-10 bg-slate-800/50 rounded animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="w-full h-14 bg-slate-800/30 rounded-2xl animate-pulse border border-neon-cyan/10" />
                <div className="w-full h-8 bg-slate-800/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
