import { db } from "./index";
import { readFileSync } from "fs";
import { join } from "path";

async function migrate() {
  console.log("Running migration...");
  
  const migrationPath = join(process.cwd(), "app", "db", "migrations", "0001_add_portfolios_table.sql");
  const sql = readFileSync(migrationPath, "utf-8");
  
  try {
    await db.execute(sql);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
