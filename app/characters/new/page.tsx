import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateCharacterForm } from "@/components/create-character-form";
import { getCurrentUser } from "@/lib/auth";

export default async function NewCharacterPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/characters/new");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link href="/characters" className="text-sm text-[color:var(--accent-strong)] hover:underline">
        {"<- "}Back to characters
      </Link>

      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">New Character</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Start with the essentials, then fill in the rest on the full sheet.
        </p>
      </header>

      <CreateCharacterForm />
    </section>
  );
}
