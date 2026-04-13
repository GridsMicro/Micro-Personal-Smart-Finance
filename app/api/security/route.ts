import { NextRequest, NextResponse } from "next/server";
import { getLoginHistory } from "@/actions/security";
import { requireAuthAPI } from "@/lib/proxy";

/**
 * GET /api/security
 * Get security info and login history
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await getLoginHistory(limit);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}
