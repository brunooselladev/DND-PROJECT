import Link from "next/link";

import { listRules } from "@/lib/compendium";
import { getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RulesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = getParam(params, "q");
  const category = getParam(params, "category");

  const rules = await listRules({
    query,
    category,
    take: 50,
  });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Rules</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Core SRD rules by category.
        </p>
      </header>

      <form className="grid gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search title or content"
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm md:col-span-2"
        />

        <input
          name="category"
          defaultValue={category}
          placeholder="Category (combat, magic...)"
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
        {rules.length > 0 ? (
          rules.map((rule) => (
            <li key={rule.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <Link href={`/rules/${rule.id}`} className="font-semibold text-[color:var(--foreground)] hover:underline">
                  {rule.title}
                </Link>
                <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
                  {rule.source}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">{rule.category}</p>
              <p className="mt-2 text-sm leading-6">{rule.content.slice(0, 220)}...</p>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-sm text-[color:var(--muted-foreground)]">
            No rules found for your current filters.
          </li>
        )}
      </ul>
    </section>
  );
}
