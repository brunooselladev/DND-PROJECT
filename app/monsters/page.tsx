import Link from "next/link";

import { listMonsters } from "@/lib/compendium";
import { getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MonstersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = getParam(params, "q");
  const challengeRating = getParam(params, "cr");

  const monsters = await listMonsters({
    query,
    challengeRating,
    take: 50,
  });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Monsters</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          SRD monster compendium with quick challenge rating filters.
        </p>
      </header>

      <form className="grid gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name or text"
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm md:col-span-2"
        />

        <input
          name="cr"
          defaultValue={challengeRating}
          placeholder="Challenge Rating (e.g. 1/4, 2)"
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm"
        />

        <div className="rounded-md border border-transparent px-3 py-2 text-sm text-[color:var(--muted-foreground)]">
          Source: SRD
        </div>

        <button
          type="submit"
          className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white md:col-span-4 md:justify-self-start"
        >
          Apply filters
        </button>
      </form>

      <ul className="space-y-3">
        {monsters.length > 0 ? (
          monsters.map((monster) => (
            <li key={monster.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <Link href={`/monsters/${monster.id}`} className="font-semibold text-[color:var(--foreground)] hover:underline">
                  {monster.name}
                </Link>
                <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
                  {monster.source}
                </span>
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                CR {monster.challengeRating} - {monster.type}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                AC {monster.armorClass} - HP {monster.hitPoints}
              </p>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-sm text-[color:var(--muted-foreground)]">
            No monsters found for your current filters.
          </li>
        )}
      </ul>
    </section>
  );
}
