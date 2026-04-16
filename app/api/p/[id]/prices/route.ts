import { NextRequest, NextResponse } from "next/server";
import { getSpecialPortfolio } from "@/actions/public-portfolio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { currentPrices } = await getSpecialPortfolio(id);
    return NextResponse.json({ success: true, prices: currentPrices });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
