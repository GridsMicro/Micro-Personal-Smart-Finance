/**
 * Real-time Price API
 * GET /api/prices?ids=bitcoin,tron
 * ดึงราคาจาก CoinGecko แบบ real-time
 * Cache 60 วินาที เพื่อไม่ให้ hit rate limit
 */

import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // cache 60s

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");

  if (!ids) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,thb&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
