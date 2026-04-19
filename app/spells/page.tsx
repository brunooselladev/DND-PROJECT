import Link from "next/link";

import { listSpells } from "@/lib/compendium";
import { getOptionalInt, getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SpellsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = getParam(params, "q");
  const school = getParam(params, "school");
  const levelText = getParam(params, "level");
  const level = getOptionalInt(levelText);

  const spells = await listSpells({
    query,
    level,
    school,
    take: 50,
  });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Spells</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          SRD spell compendium with quick search and basic filters.
        </p>
      </header>

      <form className="grid gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, school, or text"
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm md:col-span-2"
        />

        <select
          name="level"
          defaultValue={levelText}
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm"
        >
          <option value="">All Levels</option>
          {Array.from({ length: 10 }, (_, spellLevel) => (
            <option key={spellLevel} value={spellLevel}>
              Level {spellLevel}
            </option>
          ))}
        </select>

        <input
          name="school"
          defaultValue={school}
          placeholder="School (Evocation, Abjuration...)"
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm"
        />

        <button
          type="submit"
          className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white md:col-span-4 md:justify-self-start"
        >
          Apply filters
        </button>
      </form>

      <ul className="space-y-3">
        {spells.length > 0 ? (
          spells.map((spell) => (
            <li key={spell.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <Link href={`/spells/${spell.id}`} className="font-semibold text-[color:var(--foreground)] hover:underline">
                  {spell.name}
                </Link>
                <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
                  {spell.source}
                </span>
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Level {spell.level} - {spell.school}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                {spell.castingTime} - {spell.range} - {spell.duration}
              </p>
              <p className="mt-2 text-sm leading-6">{spell.description.slice(0, 180)}...</p>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-sm text-[color:var(--muted-foreground)]">
            No spells found for your current filters.
          </li>
        )}
      </ul>
    </section>
  );
}
