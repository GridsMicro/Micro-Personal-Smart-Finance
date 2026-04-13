"use server";

import { db } from "@/lib/db";
import { mcUser, mcPortfolios, mcPortfolioTransactions, supportTickets, news, newsCategories, assets } from "@/db/schema";
import { requireAdmin } from "@/app/proxy/auth";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";

// ==================== Dashboard ====================

export async function getAdminDashboard() {
  await requireAdmin();

  const [totalResult] = await db.select({ count: count() }).from(mcUser);
  const [activeResult] = await db.select({ count: count() }).from(mcUser).where(eq(mcUser.is_active, true));

  const recentUsers = await db
    .select({
      id: mcUser.id,
      name: mcUser.name,
      email: mcUser.email,
      role: mcUser.role,
      is_active: mcUser.is_active,
      created_at: mcUser.created_at,
    })
    .from(mcUser)
    .orderBy(desc(mcUser.created_at))
    .limit(10);

  const [portfolioResult] = await db.select({ count: count() }).from(mcPortfolios);
  const [txResult] = await db.select({ count: count() }).from(mcPortfolioTransactions);
  const [ticketResult] = await db.select({ count: count() }).from(supportTickets);

  return {
    totalUsers: totalResult.count,
    activeUsers: activeResult.count,
    totalPortfolios: portfolioResult.count,
    totalTransactions: txResult.count,
    totalTickets: ticketResult.count,
    recentUsers,
  };
}

// ==================== Users ====================

export async function getAllUsers() {
  await requireAdmin();
  return db.select().from(mcUser).orderBy(desc(mcUser.created_at));
}

export async function updateUserRole(user_id: string, role: "user" | "admin" | "superadmin") {
  await requireAdmin();
  await db.update(mcUser).set({ role }).where(eq(mcUser.id, user_id));
}

export async function toggleUserActive(user_id: string, is_active: boolean) {
  await requireAdmin();
  await db.update(mcUser).set({ is_active }).where(eq(mcUser.id, user_id));
}

// ==================== News Management ====================

const createNewsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().min(1),
  published_at: z.string().min(1),
  summary: z.string().optional(),
  image_url: z.string().optional(),
  source_url: z.string().optional(),
  category_id: z.string().uuid().optional(),
});

export async function getAdminNews() {
  await requireAdmin();

  return db
    .select({
      id: news.id,
      title: news.title,
      source: news.source,
      published_at: news.published_at,
      created_at: news.created_at,
      category_id: news.category_id,
      category_name: newsCategories.name,
    })
    .from(news)
    .leftJoin(newsCategories, eq(news.category_id, newsCategories.id))
    .orderBy(desc(news.published_at));
}

export async function createNews(data: unknown) {
  await requireAdmin();

  const parsed = createNewsSchema.parse(data);

  await db.insert(news).values({
    title: parsed.title,
    content: parsed.content,
    source: parsed.source,
    published_at: new Date(parsed.published_at),
    summary: parsed.summary ?? null,
    image_url: parsed.image_url ?? null,
    source_url: parsed.source_url ?? null,
    category_id: parsed.category_id ?? null,
  });
}

export async function deleteNews(id: string) {
  await requireAdmin();
  await db.delete(news).where(eq(news.id, id));
}

// ==================== News Categories ====================

const createNewsCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function getNewsCategories() {
  await requireAdmin();
  return db.select().from(newsCategories).orderBy(newsCategories.name);
}

export async function createNewsCategory(data: unknown) {
  await requireAdmin();

  const parsed = createNewsCategorySchema.parse(data);
  const slug = parsed.name.toLowerCase().replace(/\s+/g, "-");

  await db.insert(newsCategories).values({
    name: parsed.name,
    slug,
    description: parsed.description ?? null,
  });
}

// ==================== Assets Management ====================

const createAssetSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  type: z.string().default("crypto"),
  is_active: z.boolean().default(true),
  image_url: z.string().optional(),
  official_website: z.string().optional(),
});

export async function getAdminAssets() {
  await requireAdmin();
  return db.select().from(assets).orderBy(desc(assets.created_at));
}

export async function createAsset(data: unknown) {
  await requireAdmin();

  const parsed = createAssetSchema.parse(data);

  await db.insert(assets).values({
    id: parsed.id,
    symbol: parsed.symbol,
    name: parsed.name,
    type: parsed.type,
    is_active: parsed.is_active,
    image_url: parsed.image_url ?? null,
    official_website: parsed.official_website ?? null,
  });
}

export async function toggleAssetActive(id: string, is_active: boolean) {
  await requireAdmin();
  await db.update(assets).set({ is_active }).where(eq(assets.id, id));
}

export async function deleteAsset(id: string) {
  await requireAdmin();
  await db.delete(assets).where(eq(assets.id, id));
}
