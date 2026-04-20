import Link from "next/link";

import { listFeatures } from "@/lib/compendium";
import { getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FeaturesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = getParam(params, "q");
  const type = getParam(params, "type");
  const className = getParam(params, "class");

  const features = await listFeatures({ query, type, className, take: 60 });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Features</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Class features, racial traits, and feats from the SRD.
        </p>
      </header>

      <form className="grid gap-3 card-static p-4 md:grid-cols-4">
        <input name="q" defaultValue={query} placeholder="Search features..." className="input md:col-span-2" />
        <input name="class" defaultValue={className} placeholder="Class (Fighter, Wizard...)" className="input" />
        <select name="type" defaultValue={type} className="input">
          <option value="">All types</option>
          <option value="Class">Class</option>
          <option value="Subclass">Subclass</option>
        </select>
        <button type="submit" className="btn-primary md:col-span-4 md:justify-self-start">Apply filters</button>
      </form>

      <ul className="space-y-3">
        {features.length > 0 ? (
          features.map((f) => (
            <li key={f.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/features/${f.id}`} className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent-glow)] transition-colors">
                  {f.name}
                </Link>
                <div className="flex gap-2 shrink-0">
                  <span className="badge badge-accent">{f.type}</span>
                  <span className="badge badge-muted">{f.source}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {f.className ? `${f.className} ` : ""}{f.level != null ? `· Level ${f.level}` : ""}
              </p>
              {f.description ? (
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">{f.description.slice(0, 160)}{f.description.length > 160 ? "..." : ""}</p>
              ) : null}
            </li>
          ))
        ) : (
          <li className="empty-state">No features found for your current filters.</li>
        )}
      </ul>
    </section>
  );
}
