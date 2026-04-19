import Link from "next/link";

import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Login</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Optional authentication for future account features.
        </p>
      </header>

      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
        {session?.user ? (
          <>
            <p className="text-sm">You are already signed in as {session.user.email}.</p>
            <Link href="/spells" className="mt-3 inline-block text-sm text-[color:var(--accent-strong)] hover:underline">
              Go to compendium
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-[color:var(--foreground)]">
              Continue to the NextAuth sign-in screen where GitHub OAuth and a development email fallback are available.
            </p>
            <Link
              href="/api/auth/signin?callbackUrl=/spells"
              className="mt-4 inline-block rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              Open Sign In
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
