import { redirect } from "next/navigation";

import { ChatForm } from "@/components/chat-form";
import { getCurrentUser } from "@/lib/auth";
import { isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export default async function ChatPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?callbackUrl=/chat");

  const [openAIConfigured, indexedCount] = await Promise.all([
    Promise.resolve(isOpenAIConfigured()),
    prisma.document.count({ where: { status: "INDEXED" } }),
  ]);

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Chat</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Grounded answers over your indexed documents. Citations are shown per response.
        </p>
      </header>

      {!openAIConfigured ? (
        <div className="rounded-xl border border-amber-800 bg-amber-900/20 p-4 text-sm text-amber-300">
          Chat is disabled: set <code className="bg-[color:var(--surface-strong)] px-1 rounded">OPENAI_API_KEY</code> and restart the server.
        </div>
      ) : null}

      {openAIConfigured && indexedCount === 0 ? (
        <div className="card-static p-4 text-sm text-[color:var(--muted-foreground)]">
          No indexed documents yet. Ask an admin to upload a PDF in <code className="bg-[color:var(--surface-strong)] px-1 rounded">/admin/documents</code> to ground this chat.
        </div>
      ) : null}

      <ChatForm disabled={!openAIConfigured} />
    </section>
  );
}
