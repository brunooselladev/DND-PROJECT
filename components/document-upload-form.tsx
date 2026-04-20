"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { uploadDocumentAction } from "@/app/admin/documents/actions";

export function DocumentUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);
    startTransition(async () => {
      const result = await uploadDocumentAction({ status: "idle" }, formData);

      if (result.status === "success") {
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(result.message || "An error occurred");
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="card-static p-5"
    >
      <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Upload new document</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-[color:var(--foreground)]">
            PDF File <span className="text-[color:var(--accent-glow)]">*</span>
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="mt-1 block w-full text-sm text-[color:var(--muted-foreground)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--surface-strong)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--accent-glow)] hover:file:bg-[color:var(--accent-soft)]"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[color:var(--foreground)]">
            Title <span className="text-[color:var(--accent-glow)]">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="E.g. System Reference Document 5.1"
            className="input mt-1 block w-full"
          />
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-[color:var(--foreground)]">
            Source (optional)
          </label>
          <input
            id="source"
            name="source"
            type="text"
            placeholder="E.g. WotC"
            className="input mt-1 block w-full"
          />
        </div>

        <div>
          <label htmlFor="license" className="block text-sm font-medium text-[color:var(--foreground)]">
            License (optional)
          </label>
          <input
            id="license"
            name="license"
            type="text"
            placeholder="E.g. CC-BY-4.0"
            className="input mt-1 block w-full"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-5 text-right">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? "Uploading and indexing..." : "Upload & Index"}
        </button>
      </div>
    </form>
  );
}
