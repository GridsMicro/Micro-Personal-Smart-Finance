"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className = "",
  glow = false,
  interactive = false
}: GlassCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl
        bg-linear-to-br from-slate-900/80 to-slate-950/60
        backdrop-blur-xl border border-neon-cyan/15
        shadow-glass
        ${glow ? "neon-glow-cyan" : ""}
        ${interactive ? "hover:border-neon-cyan/30 transition-all duration-300 hover:neon-glow-cyan" : ""}
        ${className}
      `}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-neon-cyan/50 to-transparent" />
      {children}
    </div>
  );
}
