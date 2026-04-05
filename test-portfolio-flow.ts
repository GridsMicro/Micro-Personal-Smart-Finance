import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { portfolios, transactions, users } from "./app/db/schema";
import { eq, and } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Complete Integration Test: Portfolio-Aware Transaction System
 * 
 * Tests the complete flow:
 * 1. Create a test user
 * 2. Create portfolios
 * 3. Add transactions to portfolios
 * 4. Query transactions by portfolio
 * 5. Update transactions
 * 6. Delete portfolios (cascade delete)
 * 7. Verify data integrity
 */

interface TestResult {
  name: string;
  status: "✅ PASS" | "❌ FAIL";
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, status: "✅ PASS" | "❌ FAIL", error?: string) {
  results.push({ name, status, error });
  console.log(`${status} ${name}${error ? ": " + error : ""}`);
}

async function runTests() {
  console.log("🧪 Starting complete flow tests...\n");

  let testUserId = "";
  let portfolioId1 = 0;
  let portfolioId2 = 0;
  let transactionId1 = 0;
  let transactionId2 = 0;

  try {
    // Test 1: Create test user
    console.log("📝 Test 1: Create test user");
    try {
      // For testing, we'll create a test user entry if it doesn't exist
      // In real scenario, this would be done via NextAuth
      const testEmail = `test-portfolio-${Date.now()}@example.com`;
      const testUser = await db
        .insert(users)
        .values({
          email: testEmail,
          name: "Test User",
          role: "user",
        })
        .returning();

      testUserId = testUser[0].id;
      logTest("Create test user", "✅ PASS");
      console.log(`  User ID: ${testUserId}\n`);
    } catch (error: any) {
      logTest("Create test user", "❌ FAIL", error.message);
      return;
    }

    // Test 2: Create first portfolio
    console.log("📝 Test 2: Create portfolios");
    try {
      const portfolio1 = await db
        .insert(portfolios)
        .values({
          userId: testUserId,
          name: "BINANCE_TH",
          description: "Binance Thailand holdings",
          exchangeType: "BINANCE_TH",
        })
        .returning();

      portfolioId1 = portfolio1[0].id;
      console.log(`  ✓ Portfolio 1 created (id: ${portfolioId1})`);

      const portfolio2 = await db
        .insert(portfolios)
        .values({
          userId: testUserId,
          name: "BITKUB",
          description: "Bitkub holdings",
          exchangeType: "BITKUB",
        })
        .returning();

      portfolioId2 = portfolio2[0].id;
      console.log(`  ✓ Portfolio 2 created (id: ${portfolioId2})`);
      logTest("Create portfolios", "✅ PASS");
      console.log("");
    } catch (error: any) {
      logTest("Create portfolios", "❌ FAIL", error.message);
      return;
    }

    // Test 3: Create transactions
    console.log("📝 Test 3: Create transactions (portfolio-aware)");
    try {
      const today = new Date().toISOString().split("T")[0];

      // Transaction 1: BTC deposit in BINANCE_TH portfolio
      const tx1 = await db
        .insert(transactions)
        .values({
          userId: testUserId,
          portfolioId: portfolioId1,
          asset: "BTC",
          amount: "0.5",
          price: "2000000",
          type: "DEPOSIT",
          broker: "BINANCE_TH",
          note: "Initial BTC deposit",
          date: today,
        })
        .returning();

      transactionId1 = tx1[0].id;
      console.log(`  ✓ Transaction 1 created (id: ${transactionId1})`);

      // Transaction 2: ETH deposit in BITKUB portfolio
      const tx2 = await db
        .insert(transactions)
        .values({
          userId: testUserId,
          portfolioId: portfolioId2,
          asset: "ETH",
          amount: "2.0",
          price: "60000",
          type: "DEPOSIT",
          broker: "BITKUB",
          note: "Initial ETH deposit",
          date: today,
        })
        .returning();

      transactionId2 = tx2[0].id;
      console.log(`  ✓ Transaction 2 created (id: ${transactionId2})`);

      // Transaction 3: BTC withdrawal in BINANCE_TH portfolio
      const tx3 = await db
        .insert(transactions)
        .values({
          userId: testUserId,
          portfolioId: portfolioId1,
          asset: "BTC",
          amount: "0.1",
          type: "WITHDRAW",
          broker: "BINANCE_TH",
          note: "BTC withdrawal",
          date: today,
        })
        .returning();

      console.log(`  ✓ Transaction 3 created (id: ${tx3[0].id})`);
      logTest("Create transactions", "✅ PASS");
      console.log("");
    } catch (error: any) {
      logTest("Create transactions", "❌ FAIL", error.message);
      return;
    }

    // Test 4: Query transactions by portfolio
    console.log("📝 Test 4: Query transactions by portfolio");
    try {
      const portfolio1Txs = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, testUserId),
            eq(transactions.portfolioId, portfolioId1)
          )
        );

      const portfolio2Txs = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, testUserId),
            eq(transactions.portfolioId, portfolioId2)
          )
        );

      console.log(`  ✓ Portfolio 1 transactions: ${portfolio1Txs.length}`);
      console.log(`  ✓ Portfolio 2 transactions: ${portfolio2Txs.length}`);

      if (portfolio1Txs.length === 2 && portfolio2Txs.length === 1) {
        logTest("Query transactions by portfolio", "✅ PASS");
      } else {
        logTest(
          "Query transactions by portfolio",
          "❌ FAIL",
          `Expected 2 and 1 transactions, got ${portfolio1Txs.length} and ${portfolio2Txs.length}`
        );
      }
      console.log("");
    } catch (error: any) {
      logTest("Query transactions by portfolio", "❌ FAIL", error.message);
    }

    // Test 5: Update transaction
    console.log("📝 Test 5: Update transaction");
    try {
      await db
        .update(transactions)
        .set({
          amount: "0.6",
          note: "Updated BTC deposit amount",
        })
        .where(eq(transactions.id, transactionId1));

      const updated = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId1));

      if (updated[0].amount === "0.6") {
        logTest("Update transaction", "✅ PASS");
      } else {
        logTest(
          "Update transaction",
          "❌ FAIL",
          `Amount not updated properly`
        );
      }
      console.log("");
    } catch (error: any) {
      logTest("Update transaction", "❌ FAIL", error.message);
    }

    // Test 6: Verify portfolio constraints
    console.log("📝 Test 6: Verify portfolio constraints");
    try {
      // Check unique constraint on (userId, name)
      try {
        await db
          .insert(portfolios)
          .values({
            userId: testUserId,
            name: "BINANCE_TH", // Duplicate name
            description: "Should fail",
            exchangeType: "BINANCE_TH",
          });

        logTest(
          "Verify portfolio constraints",
          "❌ FAIL",
          "Unique constraint not enforced"
        );
      } catch (err) {
        // Expected: unique constraint violation
        console.log(`  ✓ Unique constraint enforced (as expected)`);
        logTest("Verify portfolio constraints", "✅ PASS");
      }
      console.log("");
    } catch (error: any) {
      logTest("Verify portfolio constraints", "❌ FAIL", error.message);
    }

    // Test 7: Delete portfolio (cascade delete)
    console.log("📝 Test 7: Delete portfolio (cascade delete transactions)");
    try {
      const txsBeforeDelete = await db
        .select()
        .from(transactions)
        .where(eq(transactions.portfolioId, portfolioId2));

      console.log(
        `  Before delete: ${txsBeforeDelete.length} transactions in portfolio 2`
      );

      await db.delete(portfolios).where(eq(portfolios.id, portfolioId2));

      const txsAfterDelete = await db
        .select()
        .from(transactions)
        .where(eq(transactions.portfolioId, portfolioId2));

      console.log(
        `  After delete: ${txsAfterDelete.length} transactions in portfolio 2`
      );

      if (txsAfterDelete.length === 0) {
        logTest("Delete portfolio (cascade delete)", "✅ PASS");
      } else {
        logTest(
          "Delete portfolio (cascade delete)",
          "❌ FAIL",
          "Transactions not cascade deleted"
        );
      }
      console.log("");
    } catch (error: any) {
      logTest("Delete portfolio (cascade delete)", "❌ FAIL", error.message);
    }

    // Test 8: Cleanup - Delete test data
    console.log("📝 Test 8: Cleanup test data");
    try {
      // Delete remaining portfolio (should cascade delete remaining transactions)
      await db.delete(portfolios).where(eq(portfolios.id, portfolioId1));

      // Delete test user
      await db.delete(users).where(eq(users.id, testUserId));

      logTest("Cleanup test data", "✅ PASS");
      console.log("");
    } catch (error: any) {
      logTest("Cleanup test data", "❌ FAIL", error.message);
    }
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
  } finally {
    // Summary
    console.log("📊 Test Summary:");
    console.log("================");
    const passed = results.filter((r) => r.status === "✅ PASS").length;
    const failed = results.filter((r) => r.status === "❌ FAIL").length;

    results.forEach((r) => {
      console.log(`${r.status} ${r.name}`);
    });

    console.log("");
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log("");

    if (failed === 0) {
      console.log("🎉 All tests passed!");
    } else {
      console.log(`⚠️  ${failed} test(s) failed`);
    }
  }
}

runTests();
