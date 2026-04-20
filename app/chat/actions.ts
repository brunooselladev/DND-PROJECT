"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ChatUnavailableError, answerWithRag, type RagAnswer, type ChatMessage } from "@/lib/rag/chat";

export type ChatActionResult =
  | { ok: true; answer: RagAnswer["answer"]; matches: RagAnswer["matches"]; model: string }
  | { ok: false; message: string };

export async function askRagAction(
  question: string,
  history: ChatMessage[] = [],
): Promise<ChatActionResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/chat");
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return { ok: false, message: "Please enter a question." };
  }

  try {
    const result = await answerWithRag(trimmed, history);
    return {
      ok: true,
      answer: result.answer,
      matches: result.matches,
      model: result.model,
    };
  } catch (error) {
    if (error instanceof ChatUnavailableError) {
      return { ok: false, message: error.message };
    }

    const message = error instanceof Error ? error.message : "Chat request failed.";
    return { ok: false, message };
  }
}
