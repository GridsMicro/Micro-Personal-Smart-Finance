import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

async function run() {
  const rows = await sql`SELECT recorded_at::date AS day, btc_price_thb, trx_price_thb, total_thb FROM special_portfolio_snapshots WHERE recorded_at::date IN ('2026-04-15','2026-04-16') ORDER BY recorded_at`;
  if (!rows || rows.length === 0) {
    console.log('No snapshots found for 2026-04-15 and 2026-04-16');
    process.exit(1);
  }
  console.log('Snapshots for 2026-04-15 and 2026-04-16:');
  for (const r of rows) {
    console.log(`${r.day} | btc_price_thb=${r.btc_price_thb} | trx_price_thb=${r.trx_price_thb} | total_thb=${r.total_thb}`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
