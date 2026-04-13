import { NextRequest, NextResponse } from "next/server";
import { getWatchlists, createWatchlist } from "@/actions/watchlist";
import { requireAuthAPI } from "@/lib/proxy";

/**
 * GET /api/watchlists
 * Get all watchlists for current user
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const watchlists = await getWatchlists();
    return NextResponse.json({ success: true, data: watchlists });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}

/**
 * POST /api/watchlists
 * Create new watchlist
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const body = await request.json();
    const watchlist = await createWatchlist(body);
    return NextResponse.json({ success: true, data: watchlist });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
