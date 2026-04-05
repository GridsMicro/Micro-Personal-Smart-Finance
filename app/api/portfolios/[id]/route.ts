import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/app/db";
import { portfolios } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/portfolios/:id - Update portfolio
// [EDITED]: Level 2 - Update by portfolio id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const portfolioId = parseInt(id);
    if (isNaN(portfolioId)) {
      return NextResponse.json(
        { error: "Invalid portfolio ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, exchangeType } = body;

    const updateData: Partial<typeof portfolios.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (exchangeType !== undefined) updateData.exchangeType = exchangeType;

    const updated = await db
      .update(portfolios)
      .set(updateData)
      .where(
        and(
          eq(portfolios.id, portfolioId),
          eq(portfolios.userId, session.user.id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    console.log(`[API] Updated portfolio: ${portfolioId}`);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating portfolio:", error);
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolios/:id - Delete a portfolio
// [EDITED]: Level 2 - Delete by portfolio id (cascades to transactions via FK)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const portfolioId = parseInt(id);
    if (isNaN(portfolioId)) {
      return NextResponse.json(
        { error: "Invalid portfolio ID" },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user before deleting
    const portfolio = await db
      .select()
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, portfolioId),
          eq(portfolios.userId, session.user.id)
        )
      );

    if (portfolio.length === 0) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Delete portfolio (transactions will be cascade deleted)
    await db
      .delete(portfolios)
      .where(eq(portfolios.id, portfolioId));

    console.log(`[API] Deleted portfolio: ${portfolioId}`);
    return NextResponse.json({ success: true, deletedPortfolioId: portfolioId });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}
