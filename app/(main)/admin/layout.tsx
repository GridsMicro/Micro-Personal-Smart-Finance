import { requireAdmin } from "@/lib/proxy";
import { redirect } from "next/navigation";

/**
 * Admin Layout
 * Protects admin routes - only accessible by admin/superadmin
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
