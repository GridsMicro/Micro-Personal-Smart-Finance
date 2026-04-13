"use server";

/**
 * Portfolio Module Actions
 * Server Actions for portfolio management
 * Aligned with setup_database.sql v1.1 (snake_case)
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mcPortfolios, mcPortfolioAssets, mcPortfolioTransactions } from "@/db/schema";
import { requireAuth } from "@/app/proxy/auth";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createPortfolioSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อพอร์ต").max(255),
  is_default: z.boolean().optional(),
});

const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  is_default: z.boolean().optional(),
});

const createTransactionSchema = z.object({
  portfolio_id: z.string(),
  coin_id: z.string(),
  type: z.enum(["buy", "sell", "transfer"]),
  amount: z.string().min(1, "กรุณาระบุจำนวน"),
  total: z.string().min(1, "กรุณาระบุมูลค่ารวม"),
  currency: z.string().default("USDT"),
  exchange_rate: z.string().optional(),
  note: z.string().optional(),
});

// Types
export type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean | null;
  created_at: Date | null;
  assetCount: number;
};

export type PortfolioAsset = {
  id: string;
  portfolio_id: string;
  coin_id: string;
  amount: string | null;
  created_at: Date | null;
};

export type PortfolioTransaction = {
  id: string;
  portfolio_id: string;
  coin_id: string;
  type: string;
  amount: string;
  total_value: string | null;
  currency: string | null;
  exchange_rate: string | null;
  note: string | null;
  created_at: Date | null;
};

/**
 * Get all portfolios for current user
 * @returns Array of portfolios with asset count
 */
export async function getPortfolios(): Promise<Portfolio[]> {
  const session = await requireAuth();
  const user_id = session.user.id;

  const portfolios = await db
    .select()
    .from(mcPortfolios)
    .where(eq(mcPortfolios.user_id, user_id))
    .orderBy(desc(mcPortfolios.created_at));

  // Count assets per portfolio
  const portfoliosWithCount = await Promise.all(
    portfolios.map(async (portfolio) => {
      const assets = await db
        .select()
        .from(mcPortfolioAssets)
        .where(eq(mcPortfolioAssets.portfolio_id, portfolio.id));
      return {
        ...portfolio,
        assetCount: assets.length,
      };
    })
  );

  return portfoliosWithCount;
}

/**
 * Get portfolio by ID
 * @param id - Portfolio ID
 * @returns Portfolio with assets and transactions
 */
export async function getPortfolioById(id: string): Promise<{
  portfolio: typeof mcPortfolios.$inferSelect;
  assets: PortfolioAsset[];
  transactions: PortfolioTransaction[];
}> {
  const session = await requireAuth();
  const user_id = session.user.id;

  const portfolio = await db.query.mcPortfolios.findFirst({
    where: and(
      eq(mcPortfolios.id, id),
      eq(mcPortfolios.user_id, user_id)
    ),
  });

  if (!portfolio) {
    throw new Error("ไม่พบพอร์ตนี้");
  }

  const assets = await db
    .select()
    .from(mcPortfolioAssets)
    .where(eq(mcPortfolioAssets.portfolio_id, id));

  const transactions = await db
    .select()
    .from(mcPortfolioTransactions)
    .where(eq(mcPortfolioTransactions.portfolio_id, id))
    .orderBy(desc(mcPortfolioTransactions.created_at))
    .limit(50);

  return { portfolio, assets, transactions };
}

/**
 * Create new portfolio
 * @param data - Portfolio data
 * @returns Created portfolio
 */
export async function createPortfolio(
  data: z.infer<typeof createPortfolioSchema>
): Promise<typeof mcPortfolios.$inferSelect> {
  const session = await requireAuth();
  const user_id = session.user.id;

  // Validate input
  const parsed = createPortfolioSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  // Check for duplicate name
  const existing = await db.query.mcPortfolios.findFirst({
    where: and(
      eq(mcPortfolios.user_id, user_id),
      eq(mcPortfolios.name, parsed.data.name)
    ),
  });

  if (existing) {
    throw new Error("คุณมีพอร์ตชื่อนี้อยู่แล้ว");
  }

  // If setting as default, unset other defaults
  if (parsed.data.is_default) {
    await db
      .update(mcPortfolios)
      .set({ is_default: false })
      .where(eq(mcPortfolios.user_id, user_id));
  }

  // Create portfolio
  const [portfolio] = await db
    .insert(mcPortfolios)
    .values({
      user_id: user_id,
      name: parsed.data.name,
      is_default: parsed.data.is_default ?? false,
    })
    .returning();

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");

  return portfolio;
}

/**
 * Update portfolio
 * @param id - Portfolio ID
 * @param data - Updated data
 * @returns Updated portfolio
 */
export async function updatePortfolio(
  id: string,
  data: z.infer<typeof updatePortfolioSchema>
): Promise<typeof mcPortfolios.$inferSelect> {
  const session = await requireAuth();
  const user_id = session.user.id;

  // Validate input
  const parsed = updatePortfolioSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  // Check ownership
  const existing = await db.query.mcPortfolios.findFirst({
    where: and(
      eq(mcPortfolios.id, id),
      eq(mcPortfolios.user_id, user_id)
    ),
  });

  if (!existing) {
    throw new Error("ไม่พบพอร์ตนี้");
  }

  // If setting as default, unset other defaults
  if (parsed.data.is_default) {
    await db
      .update(mcPortfolios)
      .set({ is_default: false })
      .where(eq(mcPortfolios.user_id, user_id));
  }

  // Update portfolio
  const [portfolio] = await db
    .update(mcPortfolios)
    .set({
      name: parsed.data.name,
      is_default: parsed.data.is_default,
    })
    .where(eq(mcPortfolios.id, id))
    .returning();

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");

  return portfolio;
}

/**
 * Delete portfolio
 * @param id - Portfolio ID
 */
export async function deletePortfolio(id: string): Promise<void> {
  const session = await requireAuth();
  const user_id = session.user.id;

  // Check ownership
  const existing = await db.query.mcPortfolios.findFirst({
    where: and(
      eq(mcPortfolios.id, id),
      eq(mcPortfolios.user_id, user_id)
    ),
  });

  if (!existing) {
    throw new Error("ไม่พบพอร์ตนี้");
  }

  await db.delete(mcPortfolios).where(eq(mcPortfolios.id, id));

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

/**
 * Add transaction to portfolio
 * @param data - Transaction data
 * @returns Created transaction
 */
export async function addTransaction(
  data: z.infer<typeof createTransactionSchema>
): Promise<PortfolioTransaction> {
  const session = await requireAuth();
  const user_id = session.user.id;

  // Validate input
  const parsed = createTransactionSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  const { portfolio_id, coin_id, type, amount, total, currency, exchange_rate, note } =
    parsed.data;

  // Check portfolio ownership
  const portfolio = await db.query.mcPortfolios.findFirst({
    where: and(
      eq(mcPortfolios.id, portfolio_id),
      eq(mcPortfolios.user_id, user_id)
    ),
  });

  if (!portfolio) {
    throw new Error("ไม่พบพอร์ตนี้");
  }

  // Create transaction
  const [transaction] = await db
    .insert(mcPortfolioTransactions)
    .values({
      portfolio_id,
      coin_id,
      type,
      amount,
      total_value: total,
      currency,
      exchange_rate,
      note,
    })
    .returning();

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");

  return transaction;
}

/**
 * Get portfolio transactions
 * @param portfolio_id - Portfolio ID
 * @returns Array of transactions
 */
export async function getPortfolioTransactions(portfolio_id: string): Promise<PortfolioTransaction[]> {
  const session = await requireAuth();
  const user_id = session.user.id;

  // Check ownership
  const portfolio = await db.query.mcPortfolios.findFirst({
    where: and(
      eq(mcPortfolios.id, portfolio_id),
      eq(mcPortfolios.user_id, user_id)
    ),
  });

  if (!portfolio) {
    throw new Error("ไม่พบพอร์ตนี้");
  }

  const transactions = await db.query.mcPortfolioTransactions.findMany({
    where: eq(mcPortfolioTransactions.portfolio_id, portfolio_id),
    orderBy: [desc(mcPortfolioTransactions.created_at)],
  });

  return transactions;
}
