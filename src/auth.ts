import NextAuth, { DefaultSession, User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

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

// Since auth.ts might run in edge/serverless, we instantiate the Prisma Client
// with the driver adapter. Note: For production Edge environments, ensure you
// are using Accelerate or a connection pooler if necessary.
const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : null;
// Initialize prisma defensively so it can build if DATABASE_URL is missing in some steps
const prisma = adapter ? new PrismaClient({ adapter }) : new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        // Block soft-deleted or suspended accounts
        if (user.deletedAt || user.accountStatus === "SUSPENDED") {
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
      // The user object is only passed on the initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
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
