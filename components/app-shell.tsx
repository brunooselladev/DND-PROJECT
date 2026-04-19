import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { auth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/spells", label: "Spells" },
  { href: "/monsters", label: "Monsters" },
  { href: "/rules", label: "Rules" },
];

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-app-texture">
      <div className="mx-auto flex min-h-screen w-full max-w-[1300px] flex-col md:flex-row">
        <aside className="w-full border-b border-[color:var(--border)] bg-[color:var(--surface)] p-5 md:w-72 md:border-r md:border-b-0">
          <Link href="/spells" className="block">
            <p className="font-display text-xl text-[color:var(--accent-strong)]">Arcana Index</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
              Living Rulebook
            </p>
          </Link>

          <nav className="mt-6 grid gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3 text-sm">
            {session?.user ? (
              <>
                <p className="font-medium text-[color:var(--foreground)]">
                  {session.user.name ?? session.user.email}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{session.user.email}</p>
                <Link
                  href="/api/auth/signout?callbackUrl=/spells"
                  className="mt-3 inline-block text-xs text-[color:var(--accent-strong)] hover:underline"
                >
                  Sign out
                </Link>
              </>
            ) : (
              <>
                <p className="text-[color:var(--muted-foreground)]">
                  Browsing is public. Sign in is optional for future account features.
                </p>
                <Link href="/login" className="mt-3 inline-block text-xs text-[color:var(--accent-strong)] hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
