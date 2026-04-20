import { DocumentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isOpenAIConfigured } from "@/lib/openai";
import { chunkText } from "@/lib/rag/chunker";
import { embedTexts, toVectorLiteral } from "@/lib/rag/embeddings";
import { extractPdfText } from "@/lib/rag/pdf";

export type IngestionResult = {
  documentId: string;
  chunkCount: number;
  status: DocumentStatus;
  errorMessage: string | null;
};

type IngestInput = {
  uploadedById: string;
  title: string;
  source: string;
  license: string | null;
  file: File;
};

export async function createDocumentFromPdf(input: IngestInput): Promise<IngestionResult> {
  const document = await prisma.document.create({
    data: {
      title: input.title,
      source: input.source,
      license: input.license,
      uploadedById: input.uploadedById,
      status: DocumentStatus.INDEXING,
    },
    select: { id: true },
  });

  try {
    const extracted = await extractPdfText(input.file);
    const chunks = chunkText(extracted.text);

    await prisma.document.update({
      where: { id: document.id },
      data: {
        pageCount: extracted.pageCount,
      },
    });

    if (chunks.length === 0) {
      return finalize(document.id, {
        status: DocumentStatus.FAILED,
        errorMessage: "No extractable text was found in this PDF.",
        chunkCount: 0,
      });
    }

    await prisma.documentChunk.createMany({
      data: chunks.map((chunk) => ({
        documentId: document.id,
        ordinal: chunk.ordinal,
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        tokenCount: chunk.tokenCount,
      })),
    });

    if (!isOpenAIConfigured()) {
      return finalize(document.id, {
        status: DocumentStatus.PENDING,
        errorMessage: "OPENAI_API_KEY is missing; text stored but not embedded. Reindex once configured.",
        chunkCount: chunks.length,
      });
    }

    await embedExistingChunks(document.id);

    return finalize(document.id, {
      status: DocumentStatus.INDEXED,
      errorMessage: null,
      chunkCount: chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error.";
    return finalize(document.id, {
      status: DocumentStatus.FAILED,
      errorMessage: message,
      chunkCount: await countChunks(document.id),
    });
  }
}

export async function reindexDocument(documentId: string): Promise<IngestionResult> {
  if (!isOpenAIConfigured()) {
    return finalize(documentId, {
      status: DocumentStatus.PENDING,
      errorMessage: "OPENAI_API_KEY is missing; cannot embed chunks.",
      chunkCount: await countChunks(documentId),
    });
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: DocumentStatus.INDEXING, errorMessage: null },
  });

  try {
    const chunkCount = await embedExistingChunks(documentId);

    if (chunkCount === 0) {
      return finalize(documentId, {
        status: DocumentStatus.FAILED,
        errorMessage: "No chunks found for this document.",
        chunkCount: 0,
      });
    }

    return finalize(documentId, {
      status: DocumentStatus.INDEXED,
      errorMessage: null,
      chunkCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown reindex error.";
    return finalize(documentId, {
      status: DocumentStatus.FAILED,
      errorMessage: message,
      chunkCount: await countChunks(documentId),
    });
  }
}

async function embedExistingChunks(documentId: string): Promise<number> {
  const chunks = await prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: [{ ordinal: "asc" }],
    select: { id: true, text: true },
  });

  if (chunks.length === 0) {
    return 0;
  }

  const vectors = await embedTexts(chunks.map((chunk) => chunk.text));

  for (let index = 0; index < chunks.length; index += 1) {
    const literal = toVectorLiteral(vectors[index]);
    await prisma.$executeRaw(Prisma.sql`
      UPDATE "DocumentChunk"
      SET "embedding" = ${literal}::vector
      WHERE "id" = ${chunks[index].id}
    `);
  }

  return chunks.length;
}

async function countChunks(documentId: string): Promise<number> {
  return prisma.documentChunk.count({ where: { documentId } });
}

async function finalize(
  documentId: string,
  update: { status: DocumentStatus; errorMessage: string | null; chunkCount: number },
): Promise<IngestionResult> {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: update.status,
      errorMessage: update.errorMessage,
      chunkCount: update.chunkCount,
    },
  });

  return {
    documentId,
    status: update.status,
    chunkCount: update.chunkCount,
    errorMessage: update.errorMessage,
  };
}
