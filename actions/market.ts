"use server";

import { db } from "@/lib/db";
import { assets, marketPrices } from "@/db/schema";
import { requireAuth, requireAdmin } from "@/app/proxy/auth";
import { eq, desc, asc, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function getAssets() {
  await requireAuth();
  return db
    .select()
    .from(assets)
    .where(eq(assets.is_active, true))
    .orderBy(asc(assets.symbol));
}

export async function getMarketPrices() {
  await requireAuth();
  // ดึงราคาล่าสุดของแต่ละ asset
  return db
    .select()
    .from(marketPrices)
    .orderBy(desc(marketPrices.last_updated))
    .limit(100);
}

export async function getAssetsWithPrices() {
  await requireAuth();

  const assetList = await db
    .select()
    .from(assets)
    .where(eq(assets.is_active, true))
    .orderBy(asc(assets.symbol));

  const prices = await db
    .select()
    .from(marketPrices)
    .orderBy(desc(marketPrices.last_updated));

  // map ราคาล่าสุดเข้ากับ asset
  const priceMap = new Map(prices.map((p) => [p.asset_id, p]));

  return assetList.map((a) => ({
    ...a,
    price: priceMap.get(a.id) ?? null,
  }));
}

// Admin: เพิ่ม asset ใหม่
const createAssetSchema = z.object({
  id: z.string().min(1).max(100),       // slug เช่น "bitcoin"
  symbol: z.string().min(1).max(20),    // เช่น "BTC"
  name: z.string().min(1).max(255),
  type: z.enum(["crypto", "stock", "etf", "commodity"]).default("crypto"),
  image_url: z.string().url().optional(),
  official_website: z.string().url().optional(),
});

export async function createAsset(data: z.infer<typeof createAssetSchema>) {
  await requireAdmin();

  const parsed = createAssetSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [asset] = await db
    .insert(assets)
    .values({
      id: parsed.data.id,
      symbol: parsed.data.symbol.toUpperCase(),
      name: parsed.data.name,
      type: parsed.data.type,
      is_active: true,
      image_url: parsed.data.image_url ?? null,
      official_website: parsed.data.official_website ?? null,
    })
    .returning();

  revalidatePath("/market");
  revalidatePath("/admin");
  return asset;
}

export async function toggleAssetActive(asset_id: string, is_active: boolean) {
  await requireAdmin();
  await db.update(assets).set({ is_active }).where(eq(assets.id, asset_id));
  revalidatePath("/market");
}

export async function deleteAsset(asset_id: string) {
  await requireAdmin();
  await db.delete(assets).where(eq(assets.id, asset_id));
  revalidatePath("/market");
  revalidatePath("/admin");
}

export async function updateAsset(
  asset_id: string,
  data: { symbol?: string; name?: string; image_url?: string; official_website?: string; is_active?: boolean }
) {
  await requireAdmin();
  await db.update(assets).set(data).where(eq(assets.id, asset_id));
  revalidatePath("/market");
  revalidatePath("/admin");
}
