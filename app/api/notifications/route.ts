import { NextRequest, NextResponse } from "next/server";
import { getNotifications, getUnreadCount } from "@/actions/notifications";
import { requireAuthAPI } from "@/lib/proxy";

/**
 * GET /api/notifications
 * Get notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");

    if (count === "unread") {
      const unreadCount = await getUnreadCount();
      return NextResponse.json({ success: true, data: { unreadCount } });
    }

    const notifications = await getNotifications();
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}
