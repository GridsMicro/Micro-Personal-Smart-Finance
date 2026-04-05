"use server";

import { db } from "../db";
import { transactions, dailySnapshots, portfolios } from "../db/schema";
import { and, desc, eq, or, like } from "drizzle-orm";
import { requireAuth } from "../lib/auth-proxy";
import { revalidatePath } from "next/cache";

// ดึงรายการ Transaction ทั้งหมดของผู้ใช้
export async function getTransactions() {
  const auth = await requireAuth();
  
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, auth.userId!))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

// [EDITED]: Level 2 - Get a single portfolio by ID with its transactions
export async function getPortfolioById(portfolioId: number) {
  const auth = await requireAuth();
  
  // Get portfolio details
  const portfolio = await db
    .select()
    .from(portfolios)
    .where(
      and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, auth.userId!)
      )
    )
    .limit(1);
  
  if (portfolio.length === 0) {
    return null;
  }
  
  // Get transactions for this portfolio
  const portfolioTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, auth.userId!),
        eq(transactions.portfolioId, portfolioId)
      )
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
  
  return {
    portfolio: portfolio[0],
    transactions: portfolioTransactions
  };
}

// [EDITED]: Level 2 - Support both broker (legacy) and portfolioId (new)
export async function saveTransaction(data: {
  id?: number;
  broker?: string; // Legacy field, kept for backward compatibility
  portfolioId?: number; // New field for portfolio-aware transactions
  asset: string;
  amount: string;
  price?: string;
  type: string;
  note?: string;
  date: string;
}) {
  const auth = await requireAuth();
  
  // [DEBUG]: Log incoming data
  console.log("[SERVER DEBUG] saveTransaction received:", { 
    ...data, 
    hasPrice: data.price !== undefined,
    priceValue: data.price 
  });

  if (data.id) {
    // แก้ไข - Update transaction with either broker or portfolioId
    const updateData: Record<string, any> = {
      asset: data.asset,
      amount: data.amount,
      price: data.price,
      type: data.type,
      note: data.note ?? "",
      date: data.date,
    };

    // Update broker only if provided (keep existing value if not)
    if (data.broker !== undefined) {
      updateData.broker = data.broker;
    }

    // Update portfolioId if provided
    if (data.portfolioId !== undefined) {
      updateData.portfolioId = data.portfolioId;
    }

    await db
      .update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, data.id), eq(transactions.userId, auth.userId!)));
  } else {
    // เพิ่มใหม่ - Create new transaction with either broker or portfolioId
    if (!data.broker && data.portfolioId === undefined) {
      throw new Error("Either broker or portfolioId must be provided");
    }

    const insertValues: Partial<typeof transactions.$inferInsert> = {
      userId: auth.userId!,
      asset: data.asset,
      amount: data.amount,
      price: data.price,
      type: data.type,
      note: data.note ?? "",
      date: data.date,
    };

    if (data.broker) {
      insertValues.broker = data.broker;
    }
    if (data.portfolioId !== undefined) {
      insertValues.portfolioId = data.portfolioId;
    }

    await db.insert(transactions).values(insertValues as any);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ลบ Transaction
export async function deleteTransaction(id: number) {
  const auth = await requireAuth();

  await db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, auth.userId!)));
  
  revalidatePath("/dashboard");
  return { success: true };
}

// ดึงข้อมูล Snapshot รายวันสำหรับวาดกราฟ
export async function getDailySnapshots() {
  const auth = await requireAuth();

  return await db
    .select()
    .from(dailySnapshots)
    .where(eq(dailySnapshots.userId, auth.userId!))
    .orderBy(dailySnapshots.date);
}

// 1. บันทึก Snapshot รายวัน (ใช้สำหรับแสดงผลกราฟการเติบโตเท่านั้น ไม่ส่งผลต่อรายการใน Ledger)
export async function saveDailySnapshot(data: {
  date: string;
  totalValue: string;
  holdings: Record<string, number>;
  fiatCode: string;
}) {
  const auth = await requireAuth();

  await db.insert(dailySnapshots).values({
    userId: auth.userId!,
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

// [EDITED]: Level 2 - Support both broker (legacy) and portfolioId (new)
export async function saveTrade(data: {
  date: string;
  broker?: string; // Legacy field, kept for backward compatibility
  portfolioId?: number; // New field for portfolio-aware trades
  sellAsset: string;
  sellAmount: string;
  buyAsset: string;
  buyAmount: string;
  note?: string;
}) {
  const auth = await requireAuth();

  // Require at least one of broker or portfolioId
  if (!data.broker && data.portfolioId === undefined) {
    throw new Error("Either broker or portfolioId must be provided");
  }

  const commonFields = {
    userId: auth.userId!,
    ...(data.broker && { broker: data.broker }),
    ...(data.portfolioId !== undefined && { portfolioId: data.portfolioId }),
    date: data.date,
  };

  // บันทึกรายการขาย (Withdraw)
  await db.insert(transactions).values({
    ...commonFields,
    asset: data.sellAsset,
    amount: data.sellAmount,
    type: "WITHDRAW",
    note: data.note || `Sell ${data.sellAsset} for ${data.buyAsset}`,
  });

  // บันทึกรายการซื้อ (Deposit)
  await db.insert(transactions).values({
    ...commonFields,
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
  const auth = await requireAuth();

  await db.delete(transactions)
    .where(and(
       eq(transactions.userId, auth.userId!),
       or(
         eq(transactions.broker, "SYSTEM_RECONCILE"),
         like(transactions.note, "%Snapshot Reconciliation%")
       )
    ));

  revalidatePath("/dashboard");
  return { success: true };
}




