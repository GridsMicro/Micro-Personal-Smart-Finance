"use server";

import { db } from "../db";
import { transactions, dailySnapshots } from "../db/schema";
import { and, desc, eq, or, like } from "drizzle-orm";
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
  broker: string;
  asset: string;
  amount: string;
  price?: string;
  type: string;
  note?: string;
  date: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (data.id) {
    // แก้ไข
    await db
      .update(transactions)
      .set({
        broker: data.broker,
        asset: data.asset,
        amount: data.amount,
        price: data.price,
        type: data.type,
        note: data.note ?? "",
        date: data.date,
      })
      .where(and(eq(transactions.id, data.id), eq(transactions.userId, session.user.id)));
  } else {
    // เพิ่มใหม่
    await db.insert(transactions).values({
      userId: session.user.id,
      broker: data.broker,
      asset: data.asset,
      amount: data.amount,
      price: data.price,
      type: data.type,
      note: data.note ?? "",
      date: data.date,
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ลบ Transaction
export async function deleteTransaction(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, session.user.id)));
  
  revalidatePath("/dashboard");
  return { success: true };
}

// ดึงข้อมูล Snapshot รายวันสำหรับวาดกราฟ
export async function getDailySnapshots() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return await db
    .select()
    .from(dailySnapshots)
    .where(eq(dailySnapshots.userId, session.user.id))
    .orderBy(dailySnapshots.date);
}

// 1. บันทึก Snapshot รายวัน (ใช้สำหรับแสดงผลกราฟการเติบโตเท่านั้น ไม่ส่งผลต่อรายการใน Ledger)
export async function saveDailySnapshot(data: {
  date: string;
  totalValue: string;
  holdings: Record<string, number>;
  fiatCode: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.insert(dailySnapshots).values({
    userId: session.user.id,
    date: data.date,
    totalValue: data.totalValue,
    holdingsJson: data.holdings,
    fiatCode: data.fiatCode,
  }).onConflictDoUpdate({
    target: [dailySnapshots.userId, dailySnapshots.date],
    set: {
      totalValue: data.totalValue,
      holdingsJson: data.holdings,
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// 2. บันทึกรายการเทรด (แลกเปลี่ยนเหรียญ)
export async function saveTrade(data: {
  date: string;
  broker: string;
  sellAsset: string;
  sellAmount: string;
  buyAsset: string;
  buyAmount: string;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // บันทึกรายการขาย (Withdraw)
  await db.insert(transactions).values({
    userId: session.user.id,
    broker: data.broker,
    asset: data.sellAsset,
    amount: data.sellAmount,
    type: "WITHDRAW",
    date: data.date,
    note: data.note || `Sell ${data.sellAsset} for ${data.buyAsset}`,
  });

  // บันทึกรายการซื้อ (Deposit)
  await db.insert(transactions).values({
    userId: session.user.id,
    broker: data.broker,
    asset: data.buyAsset,
    amount: data.buyAmount,
    type: "DEPOSIT",
    date: data.date,
    note: data.note || `Buy ${data.buyAsset} from ${data.sellAsset}`,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// 3. ล้างรายการที่ระบบเคยสร้างไว้ออโต้ (สำหรับแก้ไขรายการที่ผิดพลาด)
export async function clearSystemAdjustments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(transactions)
    .where(and(
       eq(transactions.userId, session.user.id),
       or(
         eq(transactions.broker, "SYSTEM_RECONCILE"),
         like(transactions.note, "%Snapshot Reconciliation%")
       )
    ));

  revalidatePath("/dashboard");
  return { success: true };
}




