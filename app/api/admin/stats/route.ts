import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db";
import { users, transactions, portfolios } from "@/app/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { count, eq } from "drizzle-orm";

// GET /api/admin/stats - Get admin dashboard stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin or superadmin
    const userRole = session.user.role;
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }
    
    // Get counts
    const userCount = await db.select({ count: count() }).from(users);
    const transactionCount = await db.select({ count: count() }).from(transactions);
    const portfolioCount = await db.select({ count: count() }).from(portfolios);
    
    // Get active users count
    const activeUserCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    
    return NextResponse.json({
      stats: {
        totalUsers: userCount[0]?.count || 0,
        totalTransactions: transactionCount[0]?.count || 0,
        totalPortfolios: portfolioCount[0]?.count || 0,
        activeUsers: activeUserCount[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
