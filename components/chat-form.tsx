"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { askRagAction, type ChatActionResult } from "@/app/chat/actions";
import type { ChatMessage } from "@/lib/rag/chat";

type Message =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string; matches: Extract<ChatActionResult, { ok: true }>["matches"]; model: string };

type Props = { disabled: boolean };

export function ChatForm({ disabled }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  function buildHistory(): ChatMessage[] {
    return messages.map((m) => ({
      role: m.kind === "user" ? "user" as const : "assistant" as const,
      content: m.text,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const trimmed = question.trim();
    if (!trimmed) return;

    setError(null);
    setMessages((prev) => [...prev, { kind: "user", text: trimmed }]);
    const history = buildHistory();
    setQuestion("");

    startTransition(async () => {
      const result = await askRagAction(trimmed, history);
      if (!result.ok) { setError(result.message); return; }
      setMessages((prev) => [...prev, { kind: "assistant", text: result.answer, matches: result.matches, model: result.model }]);
    });
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "400px" }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <p className="text-4xl">🔮</p>
              <p className="text-lg font-display text-[color:var(--muted-foreground)]">Ask anything about your indexed D&amp;D documents</p>
              <p className="text-sm text-[color:var(--muted-foreground)] opacity-60">Questions are grounded in uploaded PDFs with source citations</p>
            </div>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div key={index} className={`animate-slide-in ${message.kind === "user" ? "flex justify-end" : "flex justify-start"}`}>
            <div className={`max-w-[85%] p-4 text-sm ${message.kind === "user" ? "chat-user" : "chat-assistant"}`}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                {message.kind === "user" ? "You" : `Assistant · ${message.model}`}
              </p>
              <div className="prose-chat whitespace-pre-wrap leading-7">{message.text}</div>

              {message.kind === "assistant" && message.matches.length > 0 ? (
                <details className="mt-3 text-xs text-[color:var(--muted-foreground)]">
                  <summary className="cursor-pointer hover:text-[color:var(--foreground)] transition-colors">
                    📎 Sources ({message.matches.length})
                  </summary>
                  <ol className="mt-2 space-y-2">
                    {message.matches.map((match, mi) => (
                      <li key={match.chunkId} className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                        <p className="font-medium text-[color:var(--foreground)]">
                          [{mi + 1}] {match.documentTitle}{" "}
                          <span className="text-[color:var(--muted-foreground)]">
                            ({match.documentSource}{match.pageNumber ? ` p.${match.pageNumber}` : ""}) · {match.distance.toFixed(3)}
                          </span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-6">{match.text.slice(0, 300)}{match.text.length > 300 ? "..." : ""}</p>
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </div>
          </div>
        ))}

        {isPending ? (
          <div className="flex justify-start animate-slide-in">
            <div className="chat-assistant p-4">
              <div className="flex gap-1.5 py-2">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300 mb-3">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="card-static p-4 flex gap-3 items-end">
        <textarea
          disabled={disabled || isPending}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          rows={2}
          placeholder="¿Cómo funciona la acción Esquivar?"
          className="input flex-1 resize-none"
        />
        <button type="submit" disabled={disabled || isPending || !question.trim()} className="btn-primary shrink-0">
          {isPending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
