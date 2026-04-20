import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import { searchChunks, type RagMatch } from "@/lib/rag/search";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RagAnswer = {
  answer: string;
  matches: RagMatch[];
  model: string;
};

export class ChatUnavailableError extends Error {
  constructor(message = "OPENAI_API_KEY is not configured; chat is disabled.") {
    super(message);
    this.name = "ChatUnavailableError";
  }
}

const SYSTEM_PROMPT = `You are a D&D 5e rules assistant grounded in the user's indexed documents.

Rules:
- Answer ONLY from the provided excerpts. If they do not cover the question, say so plainly.
- Cite every factual claim with the matching [number] marker.
- Prefer quoting short passages when the rule text is decisive.
- Keep answers concise; use bullet points for lists.
- Use **bold** for key terms and spell/monster/item names.
- Respond in the same language as the user question.`;

function formatContext(matches: RagMatch[]) {
  return matches
    .map((match, index) => {
      const page = match.pageNumber ? ` p.${match.pageNumber}` : "";
      return `[${index + 1}] ${match.documentTitle} (${match.documentSource}${page})\n${match.text}`;
    })
    .join("\n\n---\n\n");
}

export async function answerWithRag(
  question: string,
  history: ChatMessage[] = [],
): Promise<RagAnswer> {
  const client = getOpenAI();
  if (!client) throw new ChatUnavailableError();

  const matches = await searchChunks(question, 5);

  if (matches.length === 0) {
    return {
      answer: "No indexed excerpts are available yet. Upload a document in the admin panel to ground the chat.",
      matches,
      model: CHAT_MODEL,
    };
  }

  const context = formatContext(matches);

  // Build messages with history for multi-turn
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Include last 6 messages of history for context
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({
    role: "user",
    content: `Question: ${question}\n\nExcerpts:\n${context}`,
  });

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages,
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "No answer produced.";

  return { answer, matches, model: CHAT_MODEL };
}
