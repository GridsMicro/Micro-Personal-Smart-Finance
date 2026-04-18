import "ts-node/register";
import { db } from "@/lib/db";
import { specialPortfolioSnapshots } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

async function main() {
  const SP_ID = "a0000000-0000-0000-0000-000000000001";
  const rows = await db
    .select()
    .from(specialPortfolioSnapshots)
    .where(eq(specialPortfolioSnapshots.portfolio_id, SP_ID))
    .orderBy(asc(specialPortfolioSnapshots.recorded_at));

  console.log(`Found ${rows.length} snapshots for ${SP_ID}`);
  for (const r of rows) {
    if (r.recorded_at) console.log(new Date(r.recorded_at).toISOString().slice(0,10), r.total_value_thb);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
