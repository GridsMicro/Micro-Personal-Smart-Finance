"use server";

import { db } from "@/lib/db";
import { supportTickets, ticketReplies } from "@/db/schema";
import { requireAuth, requireAdmin } from "@/app/proxy/auth";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const replySchema = z.object({
  ticket_id: z.string(),
  message: z.string().min(1),
});

export async function getUserTickets() {
  const session = await requireAuth();

  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.user_id, session.user.id))
    .orderBy(desc(supportTickets.created_at));

  const ticketsWithReplies = await Promise.all(
    tickets.map(async (ticket) => {
      const replies = await db
        .select()
        .from(ticketReplies)
        .where(eq(ticketReplies.ticket_id, ticket.id))
        .orderBy(desc(ticketReplies.created_at));
      return { ...ticket, replies };
    })
  );

  return ticketsWithReplies;
}

export async function getTicketById(ticket_id: string) {
  const session = await requireAuth();

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticket_id), eq(supportTickets.user_id, session.user.id)))
    .limit(1);

  if (!ticket) throw new Error("ไม่พบ ticket นี้");

  const replies = await db
    .select()
    .from(ticketReplies)
    .where(eq(ticketReplies.ticket_id, ticket.id))
    .orderBy(desc(ticketReplies.created_at));

  return { ...ticket, replies };
}

export async function createTicket(data: z.infer<typeof createTicketSchema>) {
  const session = await requireAuth();

  const parsed = createTicketSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      user_id: session.user.id,
      ticket_number: `TK-${year}-${random}`,
      subject: parsed.data.subject,
      priority: parsed.data.priority,
      status: "open",
    })
    .returning();

  revalidatePath("/support");
  return ticket;
}

export async function addReply(data: z.infer<typeof replySchema>) {
  const session = await requireAuth();

  const parsed = replySchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, parsed.data.ticket_id), eq(supportTickets.user_id, session.user.id)))
    .limit(1);

  if (!ticket) throw new Error("ไม่พบ ticket นี้");

  const [reply] = await db
    .insert(ticketReplies)
    .values({
      ticket_id: parsed.data.ticket_id,
      user_id: session.user.id,
      message: parsed.data.message,
    })
    .returning();

  revalidatePath(`/support/${parsed.data.ticket_id}`);
  return reply;
}

export async function updateTicketStatus(
  ticket_id: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  await requireAdmin();
  await db.update(supportTickets).set({ status }).where(eq(supportTickets.id, ticket_id));
  revalidatePath("/admin");
}
