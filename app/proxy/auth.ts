/**
 * Auth Proxy Module
 * Centralized authentication exports for the proxy pattern
 * 
 * Re-exports from lib/proxy for consistency with AGENT_PROTOCOL v3.1
 */

export {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  checkAuth,
  redirectIfNotAuth,
  redirectIfAuth,
  requireAuthAPI,
  AuthError,
} from "@/lib/proxy";
