"use client";

/**
 * Dashboard Page - Cyberpunk Edition
 * 
 * Glass morphism + Neon theme
 * Single dark theme only (no light mode)
 */

import { AuthGuard } from "../lib/auth-guard";
import CyberpunkDashboard from "./components/CyberpunkDashboard";
import DashboardContent, { SUPPORTED_ASSETS } from "./components/DashboardContent";
import { IconWithFallback } from "./components/IconWithFallback";

// Re-export for other pages that need these
export { SUPPORTED_ASSETS, IconWithFallback };

export default function DashboardPage() {
  return (
    <AuthGuard>
      <CyberpunkDashboard />
    </AuthGuard>
  );
}
