"use server";

import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createNotificationSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
});

export async function getNotifications() {
  const session = await requireAuth();

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.user_id, session.user.id))
    .orderBy(desc(notifications.created_at))
    .limit(50);
}

export async function getUnreadCount() {
  const session = await requireAuth();

  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.user_id, session.user.id),
        eq(notifications.is_read, false)
      )
    );

  return rows.length;
}

export async function markAsRead(notificationId: string) {
  const session = await requireAuth();

  await db
    .update(notifications)
    .set({ is_read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.user_id, session.user.id)
      )
    );

  revalidatePath("/notifications");
}

export async function markAllAsRead() {
  const session = await requireAuth();

  await db
    .update(notifications)
    .set({ is_read: true })
    .where(
      and(
        eq(notifications.user_id, session.user.id),
        eq(notifications.is_read, false)
      )
    );

  revalidatePath("/notifications");
}

export async function deleteNotification(notificationId: string) {
  const session = await requireAuth();

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.user_id, session.user.id)
      )
    );

  revalidatePath("/notifications");
}

export async function createNotification(
  userId: string,
  data: z.infer<typeof createNotificationSchema>
) {
  const parsed = createNotificationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [notification] = await db
    .insert(notifications)
    .values({
      user_id: userId,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      data: parsed.data.data ?? {},
    })
    .returning();

  return notification;
}
