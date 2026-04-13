/**
 * Authentication Proxy Pattern
 * Centralized auth checking for Server Actions
 * 
 * Usage:
 * - requireAuth() - For authenticated users
 * - requireAdmin() - For admin/superadmin only
 * - requireSuperAdmin() - For superadmin only
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require authentication - throws if not logged in
 * @returns Session with user data
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    throw new AuthError(
      "กรุณาเข้าสู่ระบบก่อนใช้งาน",
      "UNAUTHORIZED",
      401
    );
  }
  
  return session;
}

/**
 * Require admin role - throws if not admin/superadmin
 * @returns Session with admin user data
 */
export async function requireAdmin() {
  const session = await requireAuth();
  
  const allowedRoles = ["admin", "superadmin"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthError(
      "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
      "FORBIDDEN",
      403
    );
  }
  
  return session;
}

/**
 * Require superadmin role - throws if not superadmin
 * @returns Session with superadmin user data
 */
export async function requireSuperAdmin() {
  const session = await requireAuth();
  
  if (session.user.role !== "superadmin") {
    throw new AuthError(
      "ต้องการสิทธิ์ Super Admin",
      "FORBIDDEN",
      403
    );
  }
  
  return session;
}

/**
 * Check auth without throwing - for optional auth scenarios
 * @returns Session or null
 */
export async function checkAuth() {
  const session = await auth();
  return session;
}

/**
 * Redirect to login if not authenticated
 * Use this for page components
 */
export async function redirectIfNotAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Redirect to dashboard if already authenticated
 * Use this for login page
 */
export async function redirectIfAuth() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
}

/**
 * Require authentication for API routes
 * @param request - NextRequest object
 * @returns Session if authenticated
 * @throws Error if not authenticated
 */
export async function requireAuthAPI(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    throw new AuthError(
      "กรุณาเข้าสู่ระบบก่อนใช้งาน",
      "UNAUTHORIZED",
      401
    );
  }
  
  return session;
}
