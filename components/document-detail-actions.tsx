"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteDocumentAction, reindexDocumentAction } from "@/app/admin/documents/actions";

type Props = {
  documentId: string;
  canReindex: boolean;
};

export function DocumentDetailActions({ documentId, canReindex }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleReindex() {
    setError(null);
    startTransition(async () => {
      const result = await reindexDocumentAction(documentId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this document and all its chunks?")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteDocumentAction(documentId);
      if (result.ok) {
        router.push("/admin/documents");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="card-static p-4 space-y-4">
      <div className="flex flex-wrap gap-3">
        {canReindex ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleReindex}
            className="btn-primary"
          >
            {isPending ? "Processing..." : "Reindex embeddings"}
          </button>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="btn-danger"
        >
          {isPending ? "Processing..." : "Delete document"}
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
