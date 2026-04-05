import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/app/db";
import { users, transactions, portfolios, dailySnapshots } from "@/app/db/schema";
import { eq, count, sql } from "drizzle-orm";

// GET /api/profile - Get user profile with statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user basic info
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData[0];

    // Get statistics
    const [
      transactionStats,
      portfolioCount,
      latestSnapshot,
    ] = await Promise.all([
      // Transaction statistics
      db
        .select({
          totalCount: count(transactions.id),
          totalDeposits: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'DEPOSIT' THEN 1 ELSE 0 END), 0)`,
          totalWithdrawals: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'WITHDRAW' THEN 1 ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.userId, session.user.id)),

      // Portfolio count
      db
        .select({ count: count(portfolios.id) })
        .from(portfolios)
        .where(eq(portfolios.userId, session.user.id)),

      // Latest snapshot
      db
        .select({
          totalValue: dailySnapshots.totalValue,
          date: dailySnapshots.date,
          holdingsJson: dailySnapshots.holdingsJson,
        })
        .from(dailySnapshots)
        .where(eq(dailySnapshots.userId, session.user.id))
        .orderBy(sql`${dailySnapshots.date} DESC`)
        .limit(1),
    ]);

    const stats = {
      transactions: {
        total: transactionStats[0]?.totalCount || 0,
        deposits: transactionStats[0]?.totalDeposits || 0,
        withdrawals: transactionStats[0]?.totalWithdrawals || 0,
      },
      portfolios: portfolioCount[0]?.count || 0,
      latestSnapshot: latestSnapshot[0] || null,
    };

    return NextResponse.json({
      user,
      stats,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile (name, image)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image } = body;

    const updateData: Partial<typeof users.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    // Update user
    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[API] Updated profile for user: ${session.user.id}`);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
