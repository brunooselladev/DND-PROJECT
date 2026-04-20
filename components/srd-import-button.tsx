"use client";

import { useState, useTransition } from "react";

import { runSrdImportAction } from "@/app/admin/actions";

export function SrdImportButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ status: string; message?: string } | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const res = await runSrdImportAction();
            setResult(res);
          });
        }}
        className="btn-primary"
      >
        {isPending ? "Importing SRD data..." : "Import from dnd5eapi.co"}
      </button>

      {result?.status === "success" && result.message ? (
        <p className="rounded-md border border-emerald-800 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-300">
          {result.message}
        </p>
      ) : null}

      {result?.status === "error" && result.message ? (
        <p className="rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
