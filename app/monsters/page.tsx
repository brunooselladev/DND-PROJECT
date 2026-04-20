import Link from "next/link";

import { listMonsters } from "@/lib/compendium";
import { getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MonstersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = getParam(params, "q");
  const cr = getParam(params, "cr");
  const type = getParam(params, "type");

  const monsters = await listMonsters({ query, challengeRating: cr, type, take: 50 });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Monsters</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">SRD creature compendium with CR and type filters.</p>
      </header>

      <form className="grid gap-3 card-static p-4 md:grid-cols-4">
        <input name="q" defaultValue={query} placeholder="Search monsters..." className="input md:col-span-2" />
        <input name="cr" defaultValue={cr} placeholder="CR (1/4, 1, 5...)" className="input" />
        <input name="type" defaultValue={type} placeholder="Type (Beast, Dragon...)" className="input" />
        <button type="submit" className="btn-primary md:col-span-4 md:justify-self-start">Apply filters</button>
      </form>

      <ul className="space-y-3">
        {monsters.length > 0 ? (
          monsters.map((m) => (
            <li key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <Link href={`/monsters/${m.id}`} className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent-glow)] transition-colors">{m.name}</Link>
                <span className="badge badge-muted">{m.source}</span>
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{m.size} {m.type}{m.alignment ? ` · ${m.alignment}` : ""}</p>
              <div className="mt-2 flex gap-4 text-xs text-[color:var(--muted-foreground)]">
                <span>CR {m.challengeRating}</span>
                <span>AC {m.armorClass}</span>
                <span>{m.hitPoints} HP</span>
              </div>
            </li>
          ))
        ) : (
          <li className="empty-state">No monsters found for your current filters.</li>
        )}
      </ul>
    </section>
  );
}
