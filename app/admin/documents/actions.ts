"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { deleteDocument as deleteDocumentFromDb } from "@/lib/documents";
import { createDocumentFromPdf, reindexDocument } from "@/lib/rag/ingest";

export type DocumentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  documentId?: string;
};

export const INITIAL_DOCUMENT_ACTION_STATE: DocumentActionState = {
  status: "idle",
};

const ACCEPTED_MIME = new Set(["application/pdf", "application/x-pdf"]);
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/admin/documents");
  }

  if (!isAdminRole(currentUser.role)) {
    redirect("/");
  }

  return currentUser;
}

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function uploadDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const currentUser = await requireAdmin();

  const file = formData.get("file");
  const title = parseText(formData, "title");
  const source = parseText(formData, "source") || "Custom";
  const license = parseText(formData, "license") || null;

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Please choose a PDF file." };
  }

  if (!ACCEPTED_MIME.has(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
    return { status: "error", message: "Only PDF files are supported." };
  }

  if (file.size > MAX_BYTES) {
    return {
      status: "error",
      message: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 20MB.`,
    };
  }

  if (!title) {
    return { status: "error", message: "Title is required." };
  }

  const result = await createDocumentFromPdf({
    uploadedById: currentUser.id,
    title,
    source,
    license,
    file,
  });

  revalidatePath("/admin/documents");
  revalidatePath(`/admin/documents/${result.documentId}`);

  if (result.status === "FAILED") {
    return {
      status: "error",
      message: result.errorMessage ?? "Ingestion failed.",
      documentId: result.documentId,
    };
  }

  return {
    status: "success",
    message:
      result.status === "INDEXED"
        ? `Indexed ${result.chunkCount} chunks.`
        : `Stored ${result.chunkCount} chunks; embeddings pending.`,
    documentId: result.documentId,
  };
}

export async function reindexDocumentAction(documentId: string) {
  await requireAdmin();
  const result = await reindexDocument(documentId);
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/documents/${documentId}`);
  return result;
}

export async function deleteDocumentAction(documentId: string) {
  await requireAdmin();
  await deleteDocumentFromDb(documentId);
  revalidatePath("/admin/documents");
  redirect("/admin/documents");
}
