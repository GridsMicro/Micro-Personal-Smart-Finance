import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dailySnapshots, transactions } from "./app/db/schema";
import { desc } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function check() {
  console.log("🔍 Checking Daily Snapshots...");
  const snapshots = await db.select().from(dailySnapshots).orderBy(desc(dailySnapshots.date)).limit(5);
  console.log(JSON.stringify(snapshots, null, 2));

  console.log("\n🔍 Checking Latest Transactions (Auto-Reconcile)...");
  const txs = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(10);
  console.log(JSON.stringify(txs, null, 2));
}

check();
