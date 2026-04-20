import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DocumentListItem = Prisma.DocumentGetPayload<{
  select: {
    id: true;
    title: true;
    source: true;
    license: true;
    pageCount: true;
    chunkCount: true;
    status: true;
    errorMessage: true;
    createdAt: true;
    uploadedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

const LIST_SELECT = {
  id: true,
  title: true,
  source: true,
  license: true,
  pageCount: true,
  chunkCount: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  uploadedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.DocumentSelect;

export async function listDocuments(): Promise<DocumentListItem[]> {
  return prisma.document.findMany({
    select: LIST_SELECT,
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getDocumentById(id: string): Promise<DocumentListItem | null> {
  return prisma.document.findUnique({
    where: { id },
    select: LIST_SELECT,
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await prisma.document.delete({ where: { id } });
}

export async function getDocumentChunks(documentId: string, take = 20) {
  return prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: [{ ordinal: "asc" }],
    take,
    select: {
      id: true,
      ordinal: true,
      text: true,
      pageNumber: true,
      tokenCount: true,
    },
  });
}
