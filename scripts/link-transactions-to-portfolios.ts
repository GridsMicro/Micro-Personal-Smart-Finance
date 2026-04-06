/**
 * Migration: Link existing transactions to portfolios
 * 
 * รัน: npx ts-node scripts/link-transactions-to-portfolios.ts
 * 
 * อัพเดท transactions เก่าที่ไม่มี portfolio_id ให้เชื่อมโยงกับ portfolios ตาม broker
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("[MIGRATION] Linking transactions to portfolios...");
  
  // 1. หา transactions ที่ไม่มี portfolio_id
  const orphanedTxs = await sql`
    SELECT t.id, t.broker, t.user_id, t.asset, t.amount, t.type
    FROM transactions t
    WHERE t.portfolio_id IS NULL
    ORDER BY t.user_id, t.broker
  `;
  
  console.log(`[MIGRATION] Found ${orphanedTxs.length} orphaned transactions`);
  
  // 2. หา portfolios ทั้งหมด
  const portfolios = await sql`
    SELECT id, user_id, name, exchange_type
    FROM portfolios
  `;
  
  console.log(`[MIGRATION] Found ${portfolios.length} portfolios`);
  
  // 3. สร้าง lookup map: user_id + broker -> portfolio_id
  const portfolioMap = new Map();
  for (const p of portfolios) {
    const key = `${p.user_id}_${p.exchange_type}`;
    portfolioMap.set(key, p.id);
  }
  
  // 4. อัพเดทแต่ละ transaction
  let updated = 0;
  let failed = 0;
  
  for (const tx of orphanedTxs) {
    const key = `${tx.user_id}_${tx.broker}`;
    const portfolioId = portfolioMap.get(key);
    
    if (portfolioId) {
      try {
        await sql`
          UPDATE transactions
          SET portfolio_id = ${portfolioId}
          WHERE id = ${tx.id}
        `;
        updated++;
        console.log(`[MIGRATION] Linked tx ${tx.id} (${tx.asset} ${tx.type}) to portfolio ${portfolioId}`);
      } catch (err) {
        failed++;
        console.error(`[MIGRATION] Failed to update tx ${tx.id}:`, err);
      }
    } else {
      console.log(`[MIGRATION] No portfolio found for user ${tx.user_id} broker ${tx.broker} (tx ${tx.id})`);
      failed++;
    }
  }
  
  console.log("\n[MIGRATION] Complete!");
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${orphanedTxs.length}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error("[MIGRATION] Error:", err);
  process.exit(1);
});
