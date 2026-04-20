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

  const spells = await listSpells({ query, level, school, take: 50 });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Spells</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          SRD spell compendium with quick search and basic filters.
        </p>
      </header>

      <form className="grid gap-3 card-static p-4 md:grid-cols-4">
        <input name="q" defaultValue={query} placeholder="Search by name, school, or text" className="input md:col-span-2" />
        <select name="level" defaultValue={levelText} className="input">
          <option value="">All Levels</option>
          {Array.from({ length: 10 }, (_, l) => (
            <option key={l} value={l}>Level {l}</option>
          ))}
        </select>
        <input name="school" defaultValue={school} placeholder="School (Evocation, Abjuration...)" className="input" />
        <button type="submit" className="btn-primary md:col-span-4 md:justify-self-start">Apply filters</button>
      </form>

      <ul className="space-y-3">
        {spells.length > 0 ? (
          spells.map((spell) => (
            <li key={spell.id} className="card p-4">
              <div className="flex items-center justify-between">
                <Link href={`/spells/${spell.id}`} className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent-glow)] transition-colors">
                  {spell.name}
                </Link>
                <span className="badge badge-muted">{spell.source}</span>
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Level {spell.level} · {spell.school}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                {spell.castingTime} · {spell.range} · {spell.duration}
              </p>
              <p className="mt-2 text-sm leading-6">{spell.description.slice(0, 180)}...</p>
            </li>
          ))
        ) : (
          <li className="empty-state">No spells found for your current filters.</li>
        )}
      </ul>
    </section>
  );
}
