import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Home, ArrowLeft } from "lucide-react";

/**
 * 404 Not Found Page
 * Shows when page doesn't exist
 */

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center py-12">
          <div className="h-20 w-20 rounded-full bg-cyber-purple/10 flex items-center justify-center mb-6">
            <Search className="h-10 w-10 text-cyber-purple" />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">
            ไม่พบหน้านี้
          </h2>
          <p className="text-gray-400 mb-8">
            หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือลบไปแล้ว
          </p>

          <div className="flex gap-3">
            <Link href="/">
              <Button variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ย้อนกลับ
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                แดชบอร์ด
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
