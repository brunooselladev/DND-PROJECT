import Link from "next/link";
import { notFound } from "next/navigation";

import { findMonsterById } from "@/lib/compendium";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MonsterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const monster = await findMonsterById(id);

  if (!monster) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link href="/monsters" className="text-sm text-[color:var(--accent-strong)] hover:underline">
        {"<- "}Back to monsters
      </Link>

      <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-[color:var(--foreground)]">{monster.name}</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Challenge Rating {monster.challengeRating} - {monster.type}
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
            {monster.source}
          </span>
        </header>

        <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <p>
            <span className="text-[color:var(--muted-foreground)]">Armor Class:</span> {monster.armorClass}
          </p>
          <p>
            <span className="text-[color:var(--muted-foreground)]">Hit Points:</span> {monster.hitPoints}
          </p>
        </div>

        <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">Stats</h2>
        <pre className="mt-5 overflow-auto rounded-md bg-[color:var(--surface-soft)] p-4 text-xs leading-6">
          {JSON.stringify(monster.stats, null, 2)}
        </pre>

        <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">Actions</h2>
        <pre className="mt-2 overflow-auto rounded-md bg-[color:var(--surface-soft)] p-4 text-xs leading-6">
          {JSON.stringify(monster.actions, null, 2)}
        </pre>
      </article>
    </section>
  );
}
