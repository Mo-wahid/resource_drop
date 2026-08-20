import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { cache } from "react";

// NextAuth v5 Module Augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

import { prisma } from "@/lib/db";

const { handlers, signIn, signOut, auth: uncachedAuth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true }, // Join the role table
        });

        if (!user || !user.passwordHash) {
          return null; // User not found or no password (e.g., OAuth-only user in the future)
        }

        // Block non-active accounts (e.g. suspended or currently in invite/reset flow)
        if (user.deletedAt || user.accountStatus !== "ACTIVE") {
          return null;
        }

        const isValid = await argon2.verify(user.passwordHash, password);

        if (!isValid) {
          return null;
        }

        // Return the user object, mapped to the augmented User type
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role.name, // Pass the human-readable role name
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Enforce immediate force-logout if a user is suspended or deleted
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { accountStatus: true, deletedAt: true }
        });

        if (!dbUser || dbUser.deletedAt || dbUser.accountStatus !== "ACTIVE") {
          return null as any;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token) return session;

      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

export { handlers, signIn, signOut };
export const auth = cache(uncachedAuth);
