import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function createTable() {
  console.log("Creating portfolios table...");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        broker_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_user_broker UNIQUE (user_id, broker_id)
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON portfolios(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS portfolios_broker_id_idx ON portfolios(broker_id);`;
    
    console.log("✅ Portfolios table created successfully!");
  } catch (error) {
    console.error("❌ Failed to create table:", error);
    process.exit(1);
  }
}

createTable();
