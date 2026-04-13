import { NextRequest, NextResponse } from "next/server";
import { getPortfolios, createPortfolio } from "@/actions/portfolio";
import { requireAuthAPI } from "@/lib/proxy";

/**
 * GET /api/portfolio
 * Get all portfolios for current user
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const portfolios = await getPortfolios();
    return NextResponse.json({ success: true, data: portfolios });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}

/**
 * POST /api/portfolio
 * Create new portfolio
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const body = await request.json();
    const portfolio = await createPortfolio(body);
    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
