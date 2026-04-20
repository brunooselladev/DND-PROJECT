import Link from "next/link";
import { notFound } from "next/navigation";

import { findItemById } from "@/lib/compendium";

type PageProps = { params: Promise<{ id: string }> };

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await findItemById(id);

  if (!item) notFound();

  const props = Array.isArray(item.properties) ? (item.properties as string[]) : [];

  return (
    <section className="space-y-5">
      <Link href="/items" className="text-sm text-[color:var(--accent-glow)] hover:underline">← Back to items</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[color:var(--foreground)]">{item.name}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            {item.type}{item.category ? ` · ${item.category}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {item.rarity ? <span className="badge badge-gold">{item.rarity}</span> : null}
          <span className="badge badge-muted">{item.source}</span>
        </div>
      </header>

      <dl className="grid gap-3 card-static p-5 text-sm md:grid-cols-4">
        <div><dt className="text-[color:var(--muted-foreground)]">Cost</dt><dd>{item.cost ?? "—"}</dd></div>
        <div><dt className="text-[color:var(--muted-foreground)]">Weight</dt><dd>{item.weight ? `${item.weight} lb.` : "—"}</dd></div>
        <div><dt className="text-[color:var(--muted-foreground)]">Damage</dt><dd>{item.damage ? `${item.damage} ${item.damageType ?? ""}` : "—"}</dd></div>
        <div><dt className="text-[color:var(--muted-foreground)]">Armor Class</dt><dd>{item.armorClass ?? "—"}</dd></div>
      </dl>

      {props.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {props.map((p) => <span key={p} className="badge badge-accent">{p}</span>)}
        </div>
      ) : null}

      {item.description ? (
        <div className="card-static p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)] mb-3">Description</h2>
          <p className="whitespace-pre-wrap leading-7 text-sm">{item.description}</p>
        </div>
      ) : null}
    </section>
  );
}
