import { redirect } from "next/navigation";

import { getCurrentUser, isAdminRole } from "@/lib/auth";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdminRole(currentUser.role)) {
    redirect("/spells");
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Admin</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Protected admin panel for future management tools.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Current User</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-[color:var(--muted-foreground)]">Name</dt>
              <dd>{currentUser.name ?? "Unnamed user"}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted-foreground)]">Email</dt>
              <dd>{currentUser.email}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted-foreground)]">Role</dt>
              <dd>{currentUser.role}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted-foreground)]">Created</dt>
              <dd>{currentUser.createdAt.toLocaleString()}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Dashboard</h2>
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
            Placeholder for future admin tools such as user management, content moderation, and import monitoring.
          </p>
        </article>
      </div>
    </section>
  );
}
