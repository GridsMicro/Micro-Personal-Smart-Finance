import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/app/db";
import { portfolios, transactions } from "@/app/db/schema";
import { eq, and, sql } from "drizzle-orm";

// [EDITED]: Level 2 - Portfolio as real entity with transactions linked
// GET /api/portfolios - Get all portfolios for the current user with transaction counts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // [EDITED]: Include transaction count for each portfolio
    const userPortfolios = await db
      .select({
        id: portfolios.id,
        userId: portfolios.userId,
        name: portfolios.name,
        description: portfolios.description,
        exchangeType: portfolios.exchangeType,
        createdAt: portfolios.createdAt,
        updatedAt: portfolios.updatedAt,
        transactionCount: sql<number>`COUNT(${transactions.id})::int`,
      })
      .from(portfolios)
      .leftJoin(transactions, eq(transactions.portfolioId, portfolios.id))
      .where(eq(portfolios.userId, session.user.id))
      .groupBy(portfolios.id)
      .catch((err) => {
        // Table might not exist yet
        if (err.message?.includes('relation "portfolios" does not exist')) {
          console.warn('Portfolios table does not exist yet. Run migration first.');
          return [];
        }
        throw err;
      });

    return NextResponse.json(userPortfolios);
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolios" },
      { status: 500 }
    );
  }
}

// POST /api/portfolios - Create a new portfolio
// [EDITED]: Level 2 - Create real portfolio entity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, exchangeType = "CUSTOM" } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Check if portfolio name already exists for this user
    const existing = await db
      .select()
      .from(portfolios)
      .where(
        and(
          eq(portfolios.userId, session.user.id),
          eq(portfolios.name, name)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Portfolio with this name already exists" },
        { status: 409 }
      );
    }

    // Create new portfolio
    const newPortfolio = await db
      .insert(portfolios)
      .values({
        userId: session.user.id,
        name,
        description,
        exchangeType,
      })
      .returning();

    // [EDITED: 2026-04-05] Add cache revalidation
    // Reason: CORE.md § 6.3 requires revalidatePath after DB modifications
    // This ensures the dashboard overview displays fresh portfolio data
    revalidatePath("/dashboard");

    console.log(`[API] Created portfolio: ${newPortfolio[0].id} - ${name}`);
    return NextResponse.json(newPortfolio[0], { status: 201 });
  } catch (error) {
    console.error("Error creating portfolio:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}

// [ADDED: 2026-04-05] DELETE /api/portfolios?id={id} - Delete a portfolio
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get portfolio ID from query params
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('id');

    if (!portfolioId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    const id = parseInt(portfolioId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid portfolio ID" },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user
    const existing = await db
      .select()
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, id),
          eq(portfolios.userId, session.user.id)
        )
      );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Portfolio not found or access denied" },
        { status: 404 }
      );
    }

    // Delete portfolio (transactions will be deleted by cascade if set, or we delete them first)
    // First delete all transactions for this portfolio
    await db
      .delete(transactions)
      .where(eq(transactions.portfolioId, id));

    // Then delete the portfolio
    await db
      .delete(portfolios)
      .where(eq(portfolios.id, id));

    // Revalidate cache
    revalidatePath("/dashboard");

    console.log(`[API] Deleted portfolio: ${id}`);
    return NextResponse.json({ success: true, message: "Portfolio deleted" });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}
