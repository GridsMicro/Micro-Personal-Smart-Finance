/**
 * Delete orphaned transactions (no portfolio_id)
 * 
 * รัน: npx ts-node scripts/delete-orphaned-transactions.ts
 * 
 * ลบ transactions เก่าที่ไม่มี portfolio_id ออกจาก database
 */

import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("[CLEANUP] Finding orphaned transactions...");
  
  // 1. หา transactions ที่ไม่มี portfolio_id
  const orphanedTxs = await sql`
    SELECT id, broker, asset, amount, type, user_id, date
    FROM transactions
    WHERE portfolio_id IS NULL
    ORDER BY user_id, broker, asset
  `;
  
  console.log(`[CLEANUP] Found ${orphanedTxs.length} orphaned transactions`);
  
  if (orphanedTxs.length === 0) {
    console.log("[CLEANUP] No orphaned transactions found. Database is clean!");
    process.exit(0);
  }
  
  // 2. แสดงรายการที่จะลบ
  console.log("\n[CLEANUP] Transactions to be deleted:");
  orphanedTxs.forEach((tx, idx) => {
    console.log(`  ${idx + 1}. ID:${tx.id} | ${tx.asset} ${tx.type} | ${tx.amount} | ${tx.broker} | User:${tx.user_id}`);
  });
  
  // 3. ลบทีละรายการ
  let deleted = 0;
  let failed = 0;
  
  for (const tx of orphanedTxs) {
    try {
      await sql`DELETE FROM transactions WHERE id = ${tx.id}`;
      deleted++;
      console.log(`[CLEANUP] Deleted tx ${tx.id} (${tx.asset} ${tx.type})`);
    } catch (err) {
      failed++;
      console.error(`[CLEANUP] Failed to delete tx ${tx.id}:`, err);
    }
  }
  
  console.log("\n[CLEANUP] Complete!");
  console.log(`  Deleted: ${deleted}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${orphanedTxs.length}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error("[CLEANUP] Error:", err);
  process.exit(1);
});
