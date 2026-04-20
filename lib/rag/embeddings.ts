import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, getOpenAI } from "@/lib/openai";

const BATCH_SIZE = 96;

export class EmbeddingsUnavailableError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured; embeddings cannot be generated.");
    this.name = "EmbeddingsUnavailableError";
  }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const client = getOpenAI();
  if (!client) {
    throw new EmbeddingsUnavailableError();
  }

  const results: number[][] = [];

  for (let index = 0; index < texts.length; index += BATCH_SIZE) {
    const batch = texts.slice(index, index + BATCH_SIZE);
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    for (const entry of response.data) {
      results.push(entry.embedding);
    }
  }

  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}

export function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((value) => Number(value).toString()).join(",")}]`;
}
