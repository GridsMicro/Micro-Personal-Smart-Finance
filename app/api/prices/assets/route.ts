import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const list = await db
    .select({ id: assets.id, symbol: assets.symbol, name: assets.name })
    .from(assets)
    .where(eq(assets.is_active, true))
    .orderBy(asc(assets.symbol));

  return NextResponse.json(list);
}
