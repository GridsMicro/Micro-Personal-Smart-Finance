import { NextRequest, NextResponse } from "next/server";
import { getUserTickets, createTicket } from "@/actions/support";
import { requireAuthAPI } from "@/lib/proxy";

/**
 * GET /api/support
 * Get support tickets for current user
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const tickets = await getUserTickets();
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}

/**
 * POST /api/support
 * Create new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const body = await request.json();
    const ticket = await createTicket(body);
    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
