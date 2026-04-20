import Link from "next/link";
import { notFound } from "next/navigation";

import { findFeatureById } from "@/lib/compendium";

type PageProps = { params: Promise<{ id: string }> };

export default async function FeatureDetailPage({ params }: PageProps) {
  const { id } = await params;
  const feature = await findFeatureById(id);

  if (!feature) notFound();

  return (
    <section className="space-y-5">
      <Link href="/features" className="text-sm text-[color:var(--accent-glow)] hover:underline">← Back to features</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[color:var(--foreground)]">{feature.name}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            {feature.className ?? "General"}{feature.level != null ? ` · Level ${feature.level}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-accent">{feature.type}</span>
          <span className="badge badge-muted">{feature.source}</span>
        </div>
      </header>

      {feature.description ? (
        <div className="card-static p-5">
          <p className="whitespace-pre-wrap leading-7 text-sm">{feature.description}</p>
        </div>
      ) : (
        <p className="empty-state">No description available.</p>
      )}
    </section>
  );
}
