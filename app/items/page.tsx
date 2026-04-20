import Link from "next/link";

import { listItems } from "@/lib/compendium";
import { getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = getParam(params, "q");
  const type = getParam(params, "type");
  const rarity = getParam(params, "rarity");

  const items = await listItems({ query, type, rarity, take: 60 });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Items &amp; Equipment</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Weapons, armor, gear, and magic items from the SRD.
        </p>
      </header>

      <form className="grid gap-3 card-static p-4 md:grid-cols-4">
        <input name="q" defaultValue={query} placeholder="Search items..." className="input md:col-span-2" />
        <input name="type" defaultValue={type} placeholder="Type (Weapon, Armor...)" className="input" />
        <input name="rarity" defaultValue={rarity} placeholder="Rarity (Rare, Legendary...)" className="input" />
        <button type="submit" className="btn-primary md:col-span-4 md:justify-self-start">Apply filters</button>
      </form>

      <ul className="grid gap-3 md:grid-cols-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/items/${item.id}`} className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent-glow)] transition-colors">
                  {item.name}
                </Link>
                <span className="badge badge-muted shrink-0">{item.source}</span>
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {item.type}{item.category ? ` · ${item.category}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--muted-foreground)]">
                {item.cost ? <span>{item.cost}</span> : null}
                {item.weight ? <span>{item.weight} lb.</span> : null}
                {item.damage ? <span>{item.damage} {item.damageType ?? ""}</span> : null}
                {item.armorClass ? <span>AC {item.armorClass}</span> : null}
                {item.rarity ? <span className="badge badge-gold">{item.rarity}</span> : null}
              </div>
              {item.description ? (
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">{item.description.slice(0, 120)}{item.description.length > 120 ? "..." : ""}</p>
              ) : null}
            </li>
          ))
        ) : (
          <li className="empty-state md:col-span-2">No items found for your current filters.</li>
        )}
      </ul>
    </section>
  );
}
