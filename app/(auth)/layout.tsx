/**
 * Auth Layout
 * Minimal layout for login/register pages
 * No sidebar, no navigation
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#00072D]">
      {children}
    </div>
  );
}
