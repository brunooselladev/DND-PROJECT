export type Chunk = {
  ordinal: number;
  text: string;
  pageNumber: number | null;
  tokenCount: number;
};

const TARGET_CHARS = 1800;
const HARD_MAX_CHARS = 2400;
const MIN_CHARS = 200;

function estimateTokens(text: string) {
  return Math.max(1, Math.round(text.length / 4));
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitParagraphs(text: string) {
  return normalizeWhitespace(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function splitLongParagraph(paragraph: string) {
  if (paragraph.length <= HARD_MAX_CHARS) {
    return [paragraph];
  }

  const sentences = paragraph.match(/[^.!?]+[.!?]+[\s]*|[^.!?]+$/g) ?? [paragraph];
  const pieces: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (buffer.length + sentence.length > TARGET_CHARS && buffer.length >= MIN_CHARS) {
      pieces.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer += sentence;
    }
  }

  if (buffer.trim()) {
    pieces.push(buffer.trim());
  }

  return pieces;
}

export function chunkText(fullText: string): Chunk[] {
  const paragraphs = splitParagraphs(fullText).flatMap(splitLongParagraph);
  const chunks: Chunk[] = [];

  let buffer: string[] = [];
  let bufferLength = 0;

  const flush = () => {
    if (!buffer.length) {
      return;
    }

    const text = buffer.join("\n\n").trim();
    if (text.length === 0) {
      buffer = [];
      bufferLength = 0;
      return;
    }

    chunks.push({
      ordinal: chunks.length,
      text,
      pageNumber: null,
      tokenCount: estimateTokens(text),
    });

    buffer = [];
    bufferLength = 0;
  };

  for (const paragraph of paragraphs) {
    if (bufferLength + paragraph.length > TARGET_CHARS && bufferLength >= MIN_CHARS) {
      flush();
    }

    buffer.push(paragraph);
    bufferLength += paragraph.length + 2;
  }

  flush();

  return chunks;
}
