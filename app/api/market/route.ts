import { NextRequest, NextResponse } from "next/server";
import { getMarketPrices, getAssets } from "@/actions/market";

/**
 * GET /api/market
 * Get current market prices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "assets") {
      const assets = await getAssets();
      return NextResponse.json({ success: true, data: assets });
    }

    const prices = await getMarketPrices();
    return NextResponse.json({ success: true, data: prices });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
