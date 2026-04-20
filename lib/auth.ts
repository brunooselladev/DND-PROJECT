import { Role } from "@prisma/client";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

const ROLE_VALUES = new Set<Role>([Role.PLAYER, Role.DM, Role.ADMIN]);

export const githubConfigured = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
export const allowDevCredentials =
  process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_CREDENTIALS === "1";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseRole(value: string | null | undefined): Role {
  if (value && ROLE_VALUES.has(value as Role)) {
    return value as Role;
  }

  return Role.PLAYER;
}

async function syncUserByEmail(options: {
  email: string;
  name?: string | null;
  role?: Role;
  allowRoleUpdate?: boolean;
}) {
  const email = normalizeEmail(options.email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return prisma.user.create({
      data: {
        email,
        name: options.name ?? email.split("@")[0],
        role: options.role ?? Role.PLAYER,
      },
    });
  }

  const nextName = options.name ?? existingUser.name;
  const nextRole = options.allowRoleUpdate ? (options.role ?? existingUser.role) : existingUser.role;

  if (nextName === existingUser.name && nextRole === existingUser.role) {
    return existingUser;
  }

  return prisma.user.update({
    where: { id: existingUser.id },
    data: {
      name: nextName,
      role: nextRole,
    },
  });
}

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
            name: "Development Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "gm@table.party" },
              name: { label: "Display Name", type: "text", placeholder: "Dungeon Master" },
              role: { label: "Role", type: "text" },
            },
            async authorize(credentials) {
              const email = normalizeEmail(String(credentials?.email ?? ""));

              if (!email) {
                return null;
              }

              const name = String(credentials?.name ?? "").trim() || undefined;
              const role = parseRole(String(credentials?.role ?? ""));

              const user = await syncUserByEmail({
                email,
                name,
                role,
                allowRoleUpdate: true,
              });

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (!user?.email) {
        return token;
      }

      const dbUser = await syncUserByEmail({
        email: user.email,
        name: user.name,
        role: user.role,
        allowRoleUpdate: false,
      });

      token.uid = dbUser.id;
      token.role = dbUser.role;
      token.name = dbUser.name ?? token.name;
      token.email = dbUser.email;

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid && token.role) {
        session.user.id = token.uid;
        session.user.role = token.role;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export const getCurrentUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
});

export function isAdminRole(role: Role | null | undefined) {
  return role === Role.ADMIN;
}
