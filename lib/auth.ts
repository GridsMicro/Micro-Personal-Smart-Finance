import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";
import { mcUser, mcAccount } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: string } & DefaultSession["user"];
  }
  interface User {
    role?: string;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // ไม่ใช้ DrizzleAdapter — จัดการ user เองใน callbacks
  // เพราะ DrizzleAdapter ต้องการ camelCase แต่ standard ของโปรเจกต์บังคับ snake_case
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      try {
        // หา user จาก email
        let [existingUser] = await db
          .select()
          .from(mcUser)
          .where(eq(mcUser.email, user.email))
          .limit(1);

        // สร้าง user ใหม่ถ้ายังไม่มี
        if (!existingUser) {
          const [newUser] = await db
            .insert(mcUser)
            .values({
              id: crypto.randomUUID(),
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              role: "user",
              is_active: true,
            })
            .returning();
          existingUser = newUser;
        }

        // บันทึก OAuth account ถ้ายังไม่มี
        const [existingAccount] = await db
          .select()
          .from(mcAccount)
          .where(
            and(
              eq(mcAccount.provider, account.provider),
              eq(mcAccount.provider_account_id, account.providerAccountId)
            )
          )
          .limit(1);

        if (!existingAccount) {
          await db.insert(mcAccount).values({
            user_id: existingUser.id,
            type: account.type,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            refresh_token: account.refresh_token ?? null,
            access_token: account.access_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: (account.session_state as string) ?? null,
          });
        }

        // ส่ง id และ role ไปยัง jwt callback
        user.id = existingUser.id;
        user.role = existingUser.role ?? "user";

        return true;
      } catch (err) {
        console.error("[auth] signIn error:", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      // refresh role จาก DB ถ้าไม่มีใน token
      if (token.id && !token.role) {
        const [dbUser] = await db
          .select({ role: mcUser.role })
          .from(mcUser)
          .where(eq(mcUser.id, token.id as string))
          .limit(1);
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = (token.role as string) ?? "user";
      return session;
    },
  },
});
