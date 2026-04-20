import Link from "next/link";
import { notFound } from "next/navigation";

import { findRuleById } from "@/lib/compendium";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RuleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const rule = await findRuleById(id);

  if (!rule) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link href="/rules" className="text-sm text-[color:var(--accent-strong)] hover:underline">
        ← Back to rules
      </Link>

      <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-[color:var(--foreground)]">{rule.title}</h1>
            <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">{rule.category}</p>
          </div>
          <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
            {rule.source}
          </span>
        </header>

        <p className="mt-5 whitespace-pre-wrap leading-7">{rule.content}</p>
      </article>
    </section>
  );
}
