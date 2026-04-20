import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser, isAdminRole } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/spells", label: "Spells", icon: "✦" },
  { href: "/monsters", label: "Monsters", icon: "🐉" },
  { href: "/items", label: "Items", icon: "⚔" },
  { href: "/features", label: "Features", icon: "★" },
  { href: "/rules", label: "Rules", icon: "📜" },
];

type AppShellProps = { children: React.ReactNode };

export async function AppShell({ children }: AppShellProps) {
  const currentUser = await getCurrentUser();
  const navItems = [
    ...NAV_ITEMS,
    ...(currentUser ? [{ href: "/characters", label: "Characters", icon: "🎭" }] : []),
    ...(currentUser ? [{ href: "/chat", label: "Chat", icon: "💬" }] : []),
    ...(isAdminRole(currentUser?.role) ? [{ href: "/admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <div className="min-h-screen bg-app-texture">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col md:flex-row">
        <aside className="w-full border-b border-[color:var(--border)] bg-[color:var(--surface)] p-5 md:w-64 md:border-r md:border-b-0 md:min-h-screen">
          <Link href="/spells" className="block group">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-lg">🔮</div>
              <div>
                <p className="font-display text-lg font-bold text-[color:var(--accent-glow)] group-hover:text-[color:var(--foreground)] transition-colors">Arcana Index</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Living Rulebook</p>
              </div>
            </div>
          </Link>
          <nav className="mt-6 grid gap-0.5">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </nav>
          <div className="mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3 text-sm">
            {currentUser ? (
              <>
                <p className="font-medium text-[color:var(--foreground)]">{currentUser.name ?? currentUser.email}</p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{currentUser.email}</p>
                <span className="mt-2 badge badge-accent inline-block">{currentUser.role}</span>
                <SignOutButton className="mt-3 block text-xs text-[color:var(--accent-glow)] hover:text-[color:var(--foreground)] transition-colors" />
              </>
            ) : (
              <>
                <p className="text-[color:var(--muted-foreground)]">Sign in to access characters and chat.</p>
                <Link href="/login" className="mt-3 inline-block text-xs text-[color:var(--accent-glow)] hover:text-[color:var(--foreground)] transition-colors">Sign in →</Link>
              </>
            )}
          </div>
        </aside>
        <main className="flex-1 p-5 md:p-8 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
