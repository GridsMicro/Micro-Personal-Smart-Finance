"use server";

/**
 * Auth Server Actions
 * Authentication and authorization operations
 */

import { auth, signIn, signOut } from "@/lib/auth";
import { requireAuth, requireAdmin } from "@/lib/proxy";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.string().url().optional(),
});

/**
 * Get current session
 * @returns Session data or null
 */
export async function getSession() {
  return await auth();
}

/**
 * Sign in with credentials
 * @param email - User email
 * @param password - User password
 */
export async function signInWithCredentials(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Invalid credentials" };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

/**
 * Sign in with GitHub
 */
export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

/**
 * Sign out
 */
export async function signOutUser() {
  await signOut({ redirectTo: "/" });
  revalidatePath("/");
}

/**
 * Update user profile
 * @param data - Profile data to update
 */
export async function updateProfile(data: z.infer<typeof updateProfileSchema>) {
  const session = await requireAuth();
  
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  // TODO: Update user profile in database
  // await db.update(mcUser).set(parsed.data).where(eq(mcUser.id, session.user.id));

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Check if user is admin
 * @returns Boolean indicating admin status
 */
export async function checkIsAdmin() {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
