import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser, isAdminRole } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/spells", label: "Spells", icon: "⚚" },
  { href: "/monsters", label: "Monsters", icon: "🐉" },
  { href: "/items", label: "Items", icon: "⚔" },
  { href: "/features", label: "Features", icon: "✸" },
  { href: "/rules", label: "Rules", icon: "⚖" },
];

type AppShellProps = { children: React.ReactNode };

export async function AppShell({ children }: AppShellProps) {
  const currentUser = await getCurrentUser();
  const navItems = [
    ...NAV_ITEMS,
    ...(currentUser ? [{ href: "/characters", label: "Characters", icon: "🎴" }] : []),
    ...(currentUser ? [{ href: "/chat", label: "Chat", icon: "✒" }] : []),
    ...(isAdminRole(currentUser?.role) ? [{ href: "/admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <div className="min-h-screen bg-app-texture">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col md:flex-row">
        <aside className="w-full border-b border-[color:var(--border)] bg-[color:var(--background)] p-6 md:w-64 md:border-r md:border-b-0 md:min-h-screen relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <Link href="/spells" className="block group">
            <div className="text-center mb-8 pb-6 border-b border-[color:var(--border)] relative">
              <p className="font-display text-2xl font-bold text-[color:var(--accent-strong)] transition-colors">Arcana Index</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)] mt-1">Living Rulebook</p>
              {/* Subtle decorative dot */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[color:var(--background)] border border-[color:var(--border)]"></div>
            </div>
          </Link>
          <nav className="mt-6 grid gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </nav>
          <div className="mt-12 panel-ornate text-sm">
            {currentUser ? (
              <>
                <p className="font-medium text-[color:var(--foreground)]">{currentUser.name ?? currentUser.email}</p>
                <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)] truncate">{currentUser.email}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-[color:var(--accent-strong)]">Role: {currentUser.role}</p>
                <SignOutButton className="mt-4 block text-xs font-semibold text-[color:var(--accent-strong)] hover:text-[color:var(--accent-glow)] transition-colors" />
              </>
            ) : (
              <>
                <p className="text-[color:var(--muted-foreground)] leading-snug">Sign in to access characters and chat.</p>
                <Link href="/login" className="mt-4 inline-block text-xs font-semibold text-[color:var(--accent-strong)] hover:text-[color:var(--accent-glow)] transition-colors">Sign in →</Link>
              </>
            )}
          </div>
        </aside>
        <main className="flex-1 p-5 md:p-10 animate-fade-up relative z-0">{children}</main>
      </div>
    </div>
  );
}
