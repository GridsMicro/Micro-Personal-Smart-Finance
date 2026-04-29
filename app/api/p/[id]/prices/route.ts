import { NextRequest, NextResponse } from "next/server";
import { getSpecialPortfolio } from "@/actions/public-portfolio";

// ดึง USD/THB exchange rate จาก Bitkub API
async function getUsdThbRate() {
  try {
    const response = await fetch("https://api.bitkub.com/api/market/ticker", {
      next: { revalidate: 30 }
    });
    
    if (!response.ok) {
      console.warn("[getUsdThbRate] Bitkub API failed:", response.status);
      return null;
    }

    const data = await response.json();
    // Bitkub returns USDT/THB as THB_USDT.last
    const rate = data?.THB_USDT?.last;
    return rate ? parseFloat(rate) : null;
  } catch (error) {
    console.error("[getUsdThbRate] Error fetching from Bitkub:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { currentPrices } = await getSpecialPortfolio(id);
    
    // ดึง exchange rate จาก Bitkub
    const usdThbRate = await getUsdThbRate();
    
    // สร้าง timestamp สำหรับการ update ล่าสุด
    const lastUpdated = new Date().toISOString();

    return NextResponse.json({
      success: true,
      prices: currentPrices,
      exchange_rate: {
        usd_to_thb: usdThbRate,
        source: "bitkub",
        updated_at: lastUpdated
      },
      last_updated: lastUpdated,
      timestamp: new Date().getTime()
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
