import { extractText, getDocumentProxy } from "unpdf";

export type ExtractedPdf = {
  text: string;
  pageCount: number;
};

export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });

  const merged = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;

  return {
    text: merged,
    pageCount: result.totalPages,
  };
}
