"use client";

import { LucideIcon } from "lucide-react";

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: LucideIcon;
  className?: string;
}

export function NeonButton({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  className = ""
}: NeonButtonProps) {
  const variants = {
    primary: `
      bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50
      hover:bg-neon-cyan/30 hover:neon-glow-cyan
    `,
    secondary: `
      bg-slate-900/50 text-slate-300 border-slate-700
      hover:bg-slate-800/50 hover:border-slate-600
    `,
    danger: `
      bg-red-500/20 text-red-400 border-red-500/50
      hover:bg-red-500/30 hover:neon-glow-red
    `
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 px-4 py-3
        rounded-xl font-mono text-xs uppercase font-bold
        border transition-all duration-300
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
