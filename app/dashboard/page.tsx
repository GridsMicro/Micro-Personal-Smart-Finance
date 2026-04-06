"use client";

/**
 * Dashboard Page - Cyberpunk Edition
 * 
 * Glass morphism + Neon theme
 * Single dark theme only (no light mode)
 */

import { AuthGuard } from "../lib/auth-guard";
import CyberpunkDashboard from "./components/CyberpunkDashboard";
import DashboardContent from "./components/DashboardContent";
import { IconWithFallback } from "./components/IconWithFallback";
import { SUPPORTED_ASSETS } from "./lib/constants";

// Re-export for other pages that need these
export { IconWithFallback, SUPPORTED_ASSETS };

export default function DashboardPage() {
  return (
    <AuthGuard>
      <CyberpunkDashboard />
    </AuthGuard>
  );
}
