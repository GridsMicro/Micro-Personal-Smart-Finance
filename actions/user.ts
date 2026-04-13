"use server";

import { db } from "@/lib/db";
import { mcUser, userSettings } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

// user_settings ใหม่มีแค่: theme, currency, language, timezone
const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  currency: z.string().max(10).optional(),
  language: z.string().max(5).optional(),
  timezone: z.string().max(50).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.string().url().optional(),
});

export async function getUserProfile() {
  const session = await requireAuth();

  const [user] = await db
    .select()
    .from(mcUser)
    .where(eq(mcUser.id, session.user.id))
    .limit(1);

  if (!user) throw new Error("ไม่พบผู้ใช้");
  return user;
}

export async function getUserSettings() {
  const session = await requireAuth();

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.user_id, session.user.id))
    .limit(1);

  return settings ?? {
    theme: "dark",
    currency: "USD",
    language: "th",
    timezone: "Asia/Bangkok",
  };
}

export async function updateUserSettings(data: z.infer<typeof updateSettingsSchema>) {
  const session = await requireAuth();

  const parsed = updateSettingsSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.user_id, session.user.id),
  });

  if (existing) {
    await db
      .update(userSettings)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(eq(userSettings.user_id, session.user.id));
  } else {
    await db.insert(userSettings).values({ user_id: session.user.id, ...parsed.data });
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
  const session = await requireAuth();

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await db.update(mcUser).set({ ...parsed.data }).where(eq(mcUser.id, session.user.id));

  revalidatePath("/profile");
  return { success: true };
}
