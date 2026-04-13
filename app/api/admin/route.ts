import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/actions/admin";
import { requireAuthAPI } from "@/lib/proxy";

export async function GET(request: NextRequest) {
  try {
    await requireAuthAPI(request);
    const users = await getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}
