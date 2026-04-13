"use server";

import { db } from "@/lib/db";
import { watchlists, watchlistItems } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createWatchlistSchema = z.object({
  name: z.string().min(1).max(255),
});

const addItemSchema = z.object({
  watchlist_id: z.string().uuid(),
  asset_id: z.string().min(1), // ตาม schema ใหม่ใช้ asset_id
});

export async function getWatchlists() {
  const session = await requireAuth();

  const lists = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.user_id, session.user.id));

  const listsWithCount = await Promise.all(
    lists.map(async (w) => {
      const items = await db
        .select()
        .from(watchlistItems)
        .where(eq(watchlistItems.watchlist_id, w.id));
      return { ...w, item_count: items.length, items };
    })
  );

  return listsWithCount;
}

export async function getWatchlistById(id: string) {
  const session = await requireAuth();

  const [watchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, id), eq(watchlists.user_id, session.user.id)))
    .limit(1);

  if (!watchlist) throw new Error("ไม่พบวอชลิสต์นี้");

  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlist_id, id))
    .orderBy(desc(watchlistItems.added_at));

  return { ...watchlist, items };
}

export async function createWatchlist(data: z.infer<typeof createWatchlistSchema>) {
  const session = await requireAuth();

  const parsed = createWatchlistSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [watchlist] = await db
    .insert(watchlists)
    .values({ user_id: session.user.id, name: parsed.data.name })
    .returning();

  revalidatePath("/watchlist");
  return watchlist;
}

export async function addWatchlistItem(data: z.infer<typeof addItemSchema>) {
  const session = await requireAuth();

  const parsed = addItemSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [watchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, parsed.data.watchlist_id), eq(watchlists.user_id, session.user.id)))
    .limit(1);

  if (!watchlist) throw new Error("ไม่พบวอชลิสต์นี้");

  const [item] = await db
    .insert(watchlistItems)
    .values({ watchlist_id: parsed.data.watchlist_id, asset_id: parsed.data.asset_id })
    .returning();

  revalidatePath("/watchlist");
  return item;
}

export async function removeWatchlistItem(item_id: string) {
  const session = await requireAuth();

  // ตรวจ ownership ผ่าน watchlist
  const [item] = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.id, item_id))
    .limit(1);

  if (!item) throw new Error("ไม่พบรายการนี้");

  const [watchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, item.watchlist_id!), eq(watchlists.user_id, session.user.id)))
    .limit(1);

  if (!watchlist) throw new Error("ไม่มีสิทธิ์ลบรายการนี้");

  await db.delete(watchlistItems).where(eq(watchlistItems.id, item_id));
  revalidatePath("/watchlist");
}

export async function deleteWatchlist(id: string) {
  const session = await requireAuth();

  const [watchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, id), eq(watchlists.user_id, session.user.id)))
    .limit(1);

  if (!watchlist) throw new Error("ไม่พบวอชลิสต์นี้");

  await db.delete(watchlists).where(eq(watchlists.id, id));
  revalidatePath("/watchlist");
}
