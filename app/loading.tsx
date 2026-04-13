import { Loader2 } from "lucide-react";

/**
 * Global Loading State
 * Shows while page content is loading
 */

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-white/10 border-t-cyber-cyan animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-gray-400 animate-pulse">กำลังโหลด...</p>
    </div>
  );
}
