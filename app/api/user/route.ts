import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, getUserSettings, updateUserSettings } from "@/actions/user";
import { requireAuthAPI } from "@/lib/proxy";

/**
 * GET /api/user
 * Get current user profile and settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "settings") {
      const settings = await getUserSettings();
      return NextResponse.json({ success: true, data: settings });
    }

    const profile = await getUserProfile();
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}

/**
 * PATCH /api/user
 * Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const body = await request.json();
    await updateUserSettings(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
