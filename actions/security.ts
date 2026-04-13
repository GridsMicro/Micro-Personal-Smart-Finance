"use server";

import { db } from "@/lib/db";
import { loginHistory } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { eq, desc } from "drizzle-orm";

export async function getLoginHistory(limit = 10) {
  const session = await requireAuth();

  return db
    .select()
    .from(loginHistory)
    .where(eq(loginHistory.user_id, session.user.id))
    .orderBy(desc(loginHistory.logged_in_at))
    .limit(limit);
}

export async function logLoginAttempt(
  user_id: string,
  details?: { ip_address?: string; user_agent?: string }
) {
  await db.insert(loginHistory).values({
    user_id,
    ip_address: details?.ip_address ?? null,
    user_agent: details?.user_agent ?? null,
  });
}
