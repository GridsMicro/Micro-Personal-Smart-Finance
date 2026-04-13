"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Global Providers
 * Wraps the app with necessary context providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
