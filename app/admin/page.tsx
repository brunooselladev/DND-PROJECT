import Link from "next/link";
import { redirect } from "next/navigation";

import { SrdImportButton } from "@/components/srd-import-button";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { getCompendiumCounts } from "@/lib/compendium";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login?callbackUrl=/admin");
  if (!isAdminRole(currentUser.role)) redirect("/spells");

  const [counts, docCount] = await Promise.all([
    getCompendiumCounts(),
    prisma.document.count(),
  ]);

  const statCards = [
    { label: "Spells", value: counts.spells, color: "var(--accent-glow)" },
    { label: "Monsters", value: counts.monsters, color: "var(--emerald)" },
    { label: "Items", value: counts.items, color: "var(--gold)" },
    { label: "Features", value: counts.features, color: "var(--purple)" },
    { label: "Rules", value: counts.rules, color: "var(--sky)" },
    { label: "Documents", value: docCount, color: "var(--muted-foreground)" },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Admin</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Manage data, import SRD content, and upload documents.
        </p>
      </header>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="card-static p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="card-static p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">SRD Import</h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Fetch spells, monsters, items, features, and rules from the D&amp;D 5e SRD API.
          </p>
          <div className="mt-4">
            <SrdImportButton />
          </div>
        </article>

        <article className="card-static p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Tools</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/admin/documents" className="text-[color:var(--accent-glow)] hover:underline">
                Documents &amp; ingestion →
              </Link>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">Upload PDFs, review chunks, reindex embeddings.</p>
            </li>
          </ul>
        </article>

        <article className="card-static p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Current User</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="text-[color:var(--muted-foreground)]">Name</dt><dd>{currentUser.name ?? "Unnamed"}</dd></div>
            <div><dt className="text-[color:var(--muted-foreground)]">Email</dt><dd>{currentUser.email}</dd></div>
            <div><dt className="text-[color:var(--muted-foreground)]">Role</dt><dd><span className="badge badge-accent">{currentUser.role}</span></dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}
