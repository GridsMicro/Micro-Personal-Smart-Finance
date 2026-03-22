import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { transactions } from "./app/db/schema";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    const data = await db.select().from(transactions);
    console.log("Total Records:", data.length);
    const groups = data.reduce((acc: any, t) => {
        acc[t.broker] = (acc[t.broker] || 0) + 1;
        return acc;
    }, {});
    console.log("Groups:", JSON.stringify(groups, null, 2));
    console.log("Assets in Binance:", data.filter(t => t.broker === "BINANCE_TH").map(t => t.asset));
  } catch (err) {
    console.error("Database error:", err);
  }
}

main();
