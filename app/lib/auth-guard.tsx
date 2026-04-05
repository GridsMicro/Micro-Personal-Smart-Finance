"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "../dashboard/components/DashboardSkeleton";

/**
 * Client-side Auth Guard - แทน middleware.ts สำหรับ Client Components
 * 
 * ใช้ใน pages ที่ต้องการ authentication แทนการใช้ middleware
 * 
 * @example
 * ```typescript
 * export default function ProtectedPage() {
 *   const { isAuthenticated, isLoading } = useRequireAuth();
 *   
 *   if (isLoading) return <Loading />;
 *   if (!isAuthenticated) return null; // จะถูก redirect ไป login แล้ว
 *   
 *   return <div>Protected Content</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return {
    session,
    isLoading,
    isAuthenticated,
    userId: session?.user?.id,
    userRole: (session?.user as { role?: string })?.role,
  };
}

/**
 * Auth Guard Component - Wrapper สำหรับ page content
 * 
 * @example
 * ```typescript
 * export default function DashboardPage() {
 *   return (
 *     <AuthGuard>
 *       <DashboardContent />
 *     </AuthGuard>
 *   );
 * }
 * ```
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return null; // จะถูก redirect ไป login โดย useRequireAuth
  }

  return <>{children}</>;
}

/**
 * SuperAdmin Guard - ตรวจสอบว่าเป็น SuperAdmin หรือไม่
 * 
 * ใช้คู่กับ SuperAdmin cookie ที่เซ็ตจาก authActions.ts
 */
export function useRequireSuperAdmin() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();
  const router = useRouter();

  const userRole = (session?.user as { role?: string })?.role;
  const isSuperAdmin = userRole === "superadmin";

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isSuperAdmin) {
      router.push("/dashboard"); // Redirect ไปหน้าปกติถ้าไม่ใช่ superadmin
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  return {
    session,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    userId: session?.user?.id,
  };
}

/**
 * SuperAdmin Guard Component
 */
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, isSuperAdmin } = useRequireSuperAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121214]">
        <div className="text-zinc-500 text-sm">กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121214]">
        <div className="text-zinc-500">Access Denied</div>
      </div>
    );
  }

  return <>{children}</>;
}
