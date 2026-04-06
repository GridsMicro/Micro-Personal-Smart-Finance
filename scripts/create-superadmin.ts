import { db } from "../app/db";
import { users } from "../app/db/schema";
import { eq } from "drizzle-orm";

async function createSuperAdmin() {
  const email = "k.net.game03@gmail.com";
  
  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    // Update to superadmin
    await db.update(users)
      .set({ role: "superadmin", isActive: true })
      .where(eq(users.email, email));
    console.log(`✅ Updated ${email} to superadmin`);
  } else {
    // Create new superadmin user
    await db.insert(users).values({
      email,
      name: "Super Admin",
      role: "superadmin",
      isActive: true,
    });
    console.log(`✅ Created superadmin: ${email}`);
  }
  
  process.exit(0);
}

createSuperAdmin().catch(console.error);
