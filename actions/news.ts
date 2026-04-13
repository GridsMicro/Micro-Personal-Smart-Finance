"use server";

import { db } from "@/lib/db";
import { news, newsCategories } from "@/db/schema";
import { requireAdmin } from "@/lib/proxy";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createNewsSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  summary: z.string().optional(),
  image_url: z.string().url().optional(),
  source: z.string().min(1),
  source_url: z.string().url().optional(),
  category_id: z.string().optional(),
  published_at: z.date(),
});

export async function getNews() {
  // ดึง news ก่อน แล้ว join category แยก เพราะไม่มี relations defined
  const articles = await db
    .select()
    .from(news)
    .orderBy(desc(news.published_at))
    .limit(20);

  // ดึง categories ทั้งหมดมา map
  const categories = await db.select().from(newsCategories);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return articles.map((a) => ({
    ...a,
    category: a.category_id ? (catMap[a.category_id] ?? null) : null,
  }));
}

export async function getNewsById(id: string) {
  const [article] = await db
    .select()
    .from(news)
    .where(eq(news.id, id))
    .limit(1);

  if (!article) throw new Error("ไม่พบข่าวนี้");

  let category = null;
  if (article.category_id) {
    const [cat] = await db
      .select()
      .from(newsCategories)
      .where(eq(newsCategories.id, article.category_id))
      .limit(1);
    category = cat ?? null;
  }

  return { ...article, category };
}

export async function getNewsCategories() {
  return db.select().from(newsCategories).orderBy(newsCategories.name);
}

export async function getNewsByCategory(categoryId: string) {
  return db
    .select()
    .from(news)
    .where(eq(news.category_id, categoryId))
    .orderBy(desc(news.published_at))
    .limit(20);
}

export async function createNews(data: z.infer<typeof createNewsSchema>) {
  await requireAdmin();

  const parsed = createNewsSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [article] = await db
    .insert(news)
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      summary: parsed.data.summary,
      image_url: parsed.data.image_url,
      source: parsed.data.source,
      source_url: parsed.data.source_url,
      category_id: parsed.data.category_id,
      published_at: parsed.data.published_at,
    })
    .returning();

  revalidatePath("/news");
  return article;
}

export async function deleteNews(id: string) {
  await requireAdmin();
  await db.delete(news).where(eq(news.id, id));
  revalidatePath("/news");
}
