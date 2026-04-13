/**
 * Main Layout
 * Layout with sidebar and navbar for authenticated pages
 * Route group: (main)
 */

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { redirectIfNotAuth } from "@/app/proxy/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  await redirectIfNotAuth();

  return (
    <div className="min-h-screen bg-[#00072D]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
