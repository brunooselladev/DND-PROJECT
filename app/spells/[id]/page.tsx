import Link from "next/link";
import { notFound } from "next/navigation";

import { findSpellById } from "@/lib/compendium";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpellDetailPage({ params }: PageProps) {
  const { id } = await params;
  const spell = await findSpellById(id);

  if (!spell) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link href="/spells" className="text-sm text-[color:var(--accent-strong)] hover:underline">
        {"<- "}Back to spells
      </Link>

      <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-[color:var(--foreground)]">{spell.name}</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Level {spell.level} - {spell.school}
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
            {spell.source}
          </span>
        </header>

        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[color:var(--muted-foreground)]">Casting Time</dt>
            <dd>{spell.castingTime}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--muted-foreground)]">Range</dt>
            <dd>{spell.range}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--muted-foreground)]">Components</dt>
            <dd>{spell.components}</dd>
          </div>
          <div>
            <dt className="text-[color:var(--muted-foreground)]">Duration</dt>
            <dd>{spell.duration}</dd>
          </div>
        </dl>

        <p className="mt-5 whitespace-pre-wrap leading-7">{spell.description}</p>
      </article>
    </section>
  );
}
