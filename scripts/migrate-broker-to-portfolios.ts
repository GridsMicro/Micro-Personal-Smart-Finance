import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { portfolios, transactions, users } from "../app/db/schema";
import { count, eq, and, isNull } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Data Migration Script: Migrate broker → portfolioId
 * 
 * This script:
 * 1. For each user, gets all unique brokers from transactions
 * 2. Creates default portfolios for each broker if they don't exist
 * 3. Links existing transactions to their corresponding portfolios based on broker
 */

async function run() {
  console.log("🚀 Starting data migration: broker → portfolioId");
  
  try {
    // Step 1: Get all unique (userId, broker) combinations from transactions with null portfolioId
    console.log("\n📋 Step 1: Finding transactions without portfolio_id...");
    
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to process`);

    let portfolioCreated = 0;
    let transactionsMigrated = 0;

    // Step 2: Process each user
    for (const user of allUsers) {
      console.log(`\n👤 Processing user: ${user.id.substring(0, 8)}...`);

      // Get all unique brokers for this user where transactions don't have portfolioId
      const userTransactions = await db
        .select({ broker: transactions.broker })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id),
            isNull(transactions.portfolioId)
          )
        );

      const uniqueBrokers = [...new Set(userTransactions.map((t) => t.broker))];
      console.log(`  Found ${uniqueBrokers.length} unique brokers: ${uniqueBrokers.join(", ")}`);

      // For each broker, create portfolio and link transactions
      for (const broker of uniqueBrokers) {
        try {
          // Check if portfolio already exists
          const existingPortfolio = await db
            .select()
            .from(portfolios)
            .where(
              and(
                eq(portfolios.userId, user.id),
                eq(portfolios.name, broker)
              )
            );

          let portfolioId: number;

          if (existingPortfolio.length > 0) {
            portfolioId = existingPortfolio[0].id;
            console.log(`  ℹ️  Portfolio '${broker}' already exists (id: ${portfolioId})`);
          } else {
            // Create new portfolio
            const newPortfolio = await db
              .insert(portfolios)
              .values({
                userId: user.id,
                name: broker,
                description: `Default portfolio for ${broker}`,
                exchangeType: broker,
              })
              .returning();

            portfolioId = newPortfolio[0].id;
            console.log(`  ✅ Created portfolio '${broker}' (id: ${portfolioId})`);
            portfolioCreated++;
          }

          // Update all transactions with this broker to link to the portfolio
          const updateResult = await db
            .update(transactions)
            .set({ portfolioId })
            .where(
              and(
                eq(transactions.userId, user.id),
                eq(transactions.broker, broker),
                isNull(transactions.portfolioId)
              )
            );

          // Count affected rows from update result
          const affectedCount = Array.isArray(updateResult) ? updateResult.length : 1;
          if (affectedCount > 0) {
            console.log(
              `  🔗 Linked ${affectedCount} transactions to portfolio '${broker}'`
            );
            transactionsMigrated += affectedCount;
          }
        } catch (error) {
          console.error(`  ❌ Error processing broker '${broker}':`, error);
          throw error;
        }
      }
    }

    // Summary
    console.log("\n✨ Migration completed!");
    console.log(`  📦 Portfolios created: ${portfolioCreated}`);
    console.log(`  🔗 Transactions migrated: ${transactionsMigrated}`);

    // Verify the migration
    console.log("\n🔍 Verification:");
    const transactionsWithPortfolio = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        transactions.portfolioId,
      ));

    console.log(
      `  ✅ Transactions with portfolio_id: ${transactionsWithPortfolio[0]?.count || 0}`
    );

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

run();
