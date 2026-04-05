"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export type AuthResult = {
  userId: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
};

/**
 * Auth Proxy - ตรวจสอบ session แทน middleware
 * 
 * ใช้ใน Server Actions และ API Routes แทนการตรวจสอบผ่าน middleware.ts
 * 
 * @example
 * ```typescript
 * export async function myAction() {
 *   const auth = await requireAuth();
 *   if (!auth.isAuthenticated) throw new Error("Unauthorized");
 *   // ... logic
 * }
 * ```
 */
export async function checkAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return {
      userId: null,
      role: null,
      isAuthenticated: false,
      isSuperAdmin: false,
    };
  }

  const role = session.user.role || "user";
  
  return {
    userId: session.user.id,
    role,
    isAuthenticated: true,
    isSuperAdmin: role === "superadmin",
  };
}

/**
 * บังคับตรวจสอบ auth - throw error ถ้าไม่ผ่าน
 * 
 * @throws Error "Unauthorized" ถ้าไม่มี session
 */
export async function requireAuth(): Promise<AuthResult> {
  const auth = await checkAuth();
  
  if (!auth.isAuthenticated) {
    throw new Error("Unauthorized");
  }
  
  return auth;
}

/**
 * บังคับตรวจสอบ SuperAdmin - throw error ถ้าไม่ใช่ superadmin
 * 
 * @throws Error "Forbidden" ถ้าไม่ใช่ superadmin
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  
  if (!auth.isSuperAdmin) {
    throw new Error("Forbidden: SuperAdmin required");
  }
  
  return auth;
}

/**
 * Redirect ไปหน้า login ถ้าไม่มี session
 * 
 * ใช้ใน Server Components
 * 
 * @example
 * ```typescript
 * export default async function ProtectedPage() {
 *   const auth = await authOrRedirect();
 *   return <div>Welcome {auth.userId}</div>;
 * }
 * ```
 */
export async function authOrRedirect(): Promise<AuthResult> {
  const auth = await checkAuth();
  
  if (!auth.isAuthenticated) {
    redirect("/login");
  }
  
  return auth;
}

/**
 * ตรวจสอบ SuperAdmin cookie (ใช้ร่วมกับ authActions.ts)
 * 
 * ตรวจสอบจาก cookie `sf_superadmin_session` ที่เซ็ตจาก authActions.ts
 */
export async function checkSuperAdminCookie(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const superAdminSession = cookieStore.get("sf_superadmin_session");
  return superAdminSession?.value === "true";
}
