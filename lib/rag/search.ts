import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { embedQuery, toVectorLiteral } from "@/lib/rag/embeddings";

export type RagMatch = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentSource: string;
  ordinal: number;
  pageNumber: number | null;
  text: string;
  distance: number;
};

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;

export async function searchChunks(query: string, topK: number = DEFAULT_TOP_K): Promise<RagMatch[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const k = Math.min(Math.max(1, Math.floor(topK)), MAX_TOP_K);
  
  // 1. Vector Search
  const vector = await embedQuery(trimmed);
  const literal = toVectorLiteral(vector);

  const vectorRows = await prisma.$queryRaw<
    Array<{
      chunk_id: string;
      document_id: string;
      document_title: string;
      document_source: string;
      ordinal: number;
      page_number: number | null;
      text: string;
      distance: number;
    }>
  >(Prisma.sql`
    SELECT
      c."id"          AS chunk_id,
      c."documentId"  AS document_id,
      d."title"       AS document_title,
      d."source"      AS document_source,
      c."ordinal"     AS ordinal,
      c."pageNumber"  AS page_number,
      c."text"        AS text,
      (c."embedding" <=> ${literal}::vector) AS distance
    FROM "DocumentChunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE c."embedding" IS NOT NULL
      AND d."status" = 'INDEXED'
    ORDER BY c."embedding" <=> ${literal}::vector
    LIMIT ${k}
  `);

  const results: RagMatch[] = vectorRows.map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    documentTitle: row.document_title,
    documentSource: row.document_source,
    ordinal: Number(row.ordinal),
    pageNumber: row.page_number === null ? null : Number(row.page_number),
    text: row.text,
    distance: Number(row.distance),
  }));

  // 2. Structured Models Search (Full-text ILIKE fallback/boost)
  const queryWords = trimmed.split(" ").filter(w => w.length > 3);
  if (queryWords.length > 0) {
    const mainWord = queryWords[0];
    
    // Spells
    const spells = await prisma.spell.findMany({
      where: { name: { contains: mainWord, mode: 'insensitive' } },
      take: 2,
    });
    for (const spell of spells) {
      results.push({
        chunkId: `spell-${spell.id}`,
        documentId: spell.id,
        documentTitle: `Spell: ${spell.name}`,
        documentSource: spell.source,
        ordinal: 0,
        pageNumber: null,
        text: `Level ${spell.level} ${spell.school} spell. ${spell.castingTime}, ${spell.range}. ${spell.description}`,
        distance: 0.1, // Artificial distance boost for direct name matches
      });
    }

    // Monsters
    const monsters = await prisma.monster.findMany({
      where: { name: { contains: mainWord, mode: 'insensitive' } },
      take: 2,
    });
    for (const monster of monsters) {
      results.push({
        chunkId: `monster-${monster.id}`,
        documentId: monster.id,
        documentTitle: `Monster: ${monster.name}`,
        documentSource: monster.source,
        ordinal: 0,
        pageNumber: null,
        text: `${monster.size} ${monster.type}. AC: ${monster.armorClass}, HP: ${monster.hitPoints}. CR: ${monster.challengeRating}. Stats: ${JSON.stringify(monster.stats)}. Actions: ${JSON.stringify(monster.actions)}`,
        distance: 0.1,
      });
    }

    // Items
    const items = await prisma.item.findMany({
      where: { name: { contains: mainWord, mode: 'insensitive' } },
      take: 2,
    });
    for (const item of items) {
      results.push({
        chunkId: `item-${item.id}`,
        documentId: item.id,
        documentTitle: `Item: ${item.name}`,
        documentSource: item.source,
        ordinal: 0,
        pageNumber: null,
        text: `${item.type} ${item.category}. ${item.description}`,
        distance: 0.1,
      });
    }
    
    // Rules
    const rules = await prisma.rule.findMany({
      where: { OR: [ {title: { contains: mainWord, mode: 'insensitive' }}, {category: { contains: mainWord, mode: 'insensitive' }}] },
      take: 2,
    });
    for (const rule of rules) {
      results.push({
        chunkId: `rule-${rule.id}`,
        documentId: rule.id,
        documentTitle: `Rule: ${rule.title} (${rule.category})`,
        documentSource: rule.source,
        ordinal: 0,
        pageNumber: null,
        text: rule.content,
        distance: 0.15,
      });
    }
  }

  // Sort combined results by distance and take top K
  results.sort((a, b) => a.distance - b.distance);
  return results.slice(0, k);
}
