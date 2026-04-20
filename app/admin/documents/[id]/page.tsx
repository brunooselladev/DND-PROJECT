import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DocumentDetailActions } from "@/components/document-detail-actions";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { getDocumentById, getDocumentChunks } from "@/lib/documents";
import { isOpenAIConfigured } from "@/lib/openai";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?callbackUrl=/admin/documents/${id}`);
  }

  if (!isAdminRole(currentUser.role)) {
    redirect("/");
  }

  const [document, previewChunks] = await Promise.all([
    getDocumentById(id),
    getDocumentChunks(id, 10),
  ]);

  if (!document) {
    notFound();
  }

  const openAIConfigured = isOpenAIConfigured();
  const uploader = document.uploadedBy.name ?? document.uploadedBy.email;

  const STATUS_CLASS: Record<string, string> = {
    PENDING: "status-pending",
    INDEXING: "status-indexing",
    INDEXED: "status-indexed",
    FAILED: "status-failed",
  };

  return (
    <section className="space-y-5">
      <Link
        href="/admin/documents"
        className="text-sm text-[color:var(--accent-glow)] hover:underline"
      >
        ← Back to documents
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[color:var(--foreground)]">{document.title}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            {document.source}
            {document.license ? ` · ${document.license}` : ""}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
            Uploaded by {uploader} · {document.createdAt.toLocaleString()}
          </p>
        </div>

        <span className={`badge ${STATUS_CLASS[document.status] ?? "badge-muted"}`}>
          {document.status}
        </span>
      </header>

      <dl className="grid gap-3 card-static p-5 text-sm md:grid-cols-3">
        <div>
          <dt className="text-[color:var(--muted-foreground)]">Chunks</dt>
          <dd>{document.chunkCount}</dd>
        </div>
        <div>
          <dt className="text-[color:var(--muted-foreground)]">Pages</dt>
          <dd>{document.pageCount ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[color:var(--muted-foreground)]">Status</dt>
          <dd>{document.status}</dd>
        </div>
      </dl>

      {document.errorMessage ? (
        <p className="rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
          {document.errorMessage}
        </p>
      ) : null}

      <DocumentDetailActions documentId={document.id} canReindex={openAIConfigured} />

      <div>
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Preview chunks</h2>
        {previewChunks.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {previewChunks.map((chunk) => (
              <li
                key={chunk.id}
                className="card-static p-4 text-sm"
              >
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
                  <span>
                    #{chunk.ordinal}
                    {chunk.pageNumber ? ` · p.${chunk.pageNumber}` : ""}
                  </span>
                  {chunk.tokenCount ? <span>≈ {chunk.tokenCount} tokens</span> : null}
                </div>
                <p className="whitespace-pre-wrap leading-6">{chunk.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 empty-state">
            No chunks stored yet.
          </p>
        )}
      </div>
    </section>
  );
}
