"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Global Error Page
 * Catches all unhandled errors in the application
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center py-12">
          <div className="h-20 w-20 rounded-full bg-cyber-red/10 flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-cyber-red" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-gray-400 mb-6">
            ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
          </p>

          {error.digest && (
            <p className="text-xs text-gray-500 mb-6">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} variant="secondary">
              <RefreshCw className="mr-2 h-4 w-4" />
              ลองใหม่
            </Button>
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                หน้าแรก
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
