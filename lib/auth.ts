import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

const githubConfigured = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
const allowDevCredentials = process.env.NODE_ENV !== "production";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(githubConfigured
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
          }),
        ]
      : []),
    ...(allowDevCredentials
      ? [
          CredentialsProvider({
            id: "dev-email",
            name: "Email (Development)",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "gm@table.party" },
            },
            async authorize(credentials) {
              const email = String(credentials?.email ?? "")
                .trim()
                .toLowerCase();

              if (!email) {
                return null;
              }

              const user = await prisma.user.upsert({
                where: { email },
                create: { email, name: email.split("@")[0] },
                update: {},
              });

              return {
                id: user.id,
                email: user.email,
                name: user.name,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
        return token;
      }

      if (!token.email) {
        return token;
      }

      const dbUser = await prisma.user.upsert({
        where: { email: token.email.toLowerCase() },
        create: {
          email: token.email.toLowerCase(),
          name: token.name,
        },
        update: {
          name: token.name ?? undefined,
        },
      });

      token.uid = dbUser.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
