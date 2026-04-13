import { NextRequest, NextResponse } from "next/server";
import { getNews, getNewsCategories } from "@/actions/news";

/**
 * GET /api/news
 * Get news articles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "categories") {
      const categories = await getNewsCategories();
      return NextResponse.json({ success: true, data: categories });
    }

    const articles = await getNews();
    return NextResponse.json({ success: true, data: articles });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
