import Link from "next/link";
import { redirect } from "next/navigation";

import { DocumentUploadForm } from "@/components/document-upload-form";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { isOpenAIConfigured } from "@/lib/openai";

const STATUS_CLASS: Record<string, string> = {
  PENDING: "status-pending",
  INDEXING: "status-indexing",
  INDEXED: "status-indexed",
  FAILED: "status-failed",
};

export default async function AdminDocumentsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?callbackUrl=/admin/documents");
  if (!isAdminRole(currentUser.role)) redirect("/");

  const documents = await listDocuments();
  const openAIConfigured = isOpenAIConfigured();

  return (
    <section className="space-y-5">
      <Link href="/admin" className="text-sm text-[color:var(--accent-glow)] hover:underline">← Back to admin</Link>

      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Documents</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Upload PDFs to index their text for the grounded chat.</p>
      </header>

      {!openAIConfigured ? (
        <div className="rounded-xl border border-amber-800 bg-amber-900/20 p-4 text-sm text-amber-300">
          <p className="font-medium">OPENAI_API_KEY is not configured.</p>
          <p className="mt-1">Uploads will store extracted text but skip embeddings. Add the key and reindex each document once it is available.</p>
        </div>
      ) : null}

      <DocumentUploadForm />

      <div>
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Indexed documents</h2>
        {documents.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {documents.map((doc) => (
              <li key={doc.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/documents/${doc.id}`} className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent-glow)] transition-colors">{doc.title}</Link>
                    <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
                      {doc.source}{doc.license ? ` · ${doc.license}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                      {doc.chunkCount} chunks{doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_CLASS[doc.status] ?? "badge-muted"}`}>{doc.status}</span>
                </div>
                {doc.errorMessage ? <p className="mt-3 text-xs text-red-400">{doc.errorMessage}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 empty-state">No documents indexed yet.</p>
        )}
      </div>
    </section>
  );
}
