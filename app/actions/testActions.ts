"use server";

import { db } from "../db";
import { transactions } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth-proxy";

// ทดสอบบันทึก price ลง database
export async function testSavePrice() {
  const auth = await requireAuth();
  
  // บันทึก transaction ทดสอบ
  const result = await db.insert(transactions).values({
    userId: auth.userId!,
    broker: "BINANCE_TH",
    asset: "BTC",
    amount: "0.02282",
    price: "50000",
    type: "DEPOSIT",
    note: "Test price 50000",
    date: new Date().toISOString().split('T')[0]
  }).returning();
  
  console.log("[TEST] Inserted transaction:", result);
  
  // ดึงข้อมูลกลับมาตรวจสอบ
  const fetched = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, result[0].id));
  
  console.log("[TEST] Fetched from DB:", fetched);
  
  return { 
    success: true, 
    inserted: result[0],
    fetched: fetched[0],
    priceMatch: fetched[0]?.price === "50000"
  };
}

// ดึง transactions ล่าสุดมาดู
export async function getLatestTransactions(limit: number = 5) {
  const auth = await requireAuth();
  
  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, auth.userId!))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
  
  console.log("[TEST] Latest transactions:", result);
  
  return result;
}
