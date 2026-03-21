"use server";

import { db } from "../db";
import { transactions } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// ดึงรายการ Transaction ทั้งหมดของผู้ใช้
export async function getTransactions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, session.user.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

// เพิ่มหรือแก้ไข Transaction
export async function saveTransaction(data: {
  id?: number;
  asset: string;
  amount: string;
  type: string;
  note: string;
  date: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (data.id) {
    // แก้ไข
    await db
      .update(transactions)
      .set({
        asset: data.asset,
        amount: data.amount,
        type: data.type,
        note: data.note,
        date: data.date,
      })
      .where(eq(transactions.id, data.id))
      .where(eq(transactions.userId, session.user.id)); // ตรวจสอบ ID ผู้เข้าถึง
  } else {
    // เพิ่มใหม่
    await db.insert(transactions).values({
      userId: session.user.id,
      asset: data.asset,
      amount: data.amount,
      type: data.type,
      note: data.note,
      date: data.date,
    });
  }

  revalidatePath("/");
  return { success: true };
}

// ลบ Transaction
export async function deleteTransaction(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(transactions)
    .where(eq(transactions.id, id))
    .where(eq(transactions.userId, session.user.id)); // ตรวจสอบ ID ผู้เข้าถึง
  
  revalidatePath("/");
  return { success: true };
}
