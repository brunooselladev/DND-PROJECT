import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { canViewAllCharacters, listCharactersForViewer } from "@/lib/characters";

export default async function CharactersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/characters");
  }

  const characters = await listCharactersForViewer(currentUser.id, currentUser.role);
  const showOwner = canViewAllCharacters(currentUser.role);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[color:var(--foreground)]">Characters</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            {showOwner
              ? "Browse every character sheet in the campaign. Owners can still edit only their own sheets."
              : "Your character sheets, ready for quick play updates."}
          </p>
        </div>

        <Link
          href="/characters/new"
          className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white"
        >
          New character
        </Link>
      </header>

      {characters.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {characters.map((character) => (
            <li
              key={character.id}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/characters/${character.id}`}
                    className="font-semibold text-[color:var(--foreground)] hover:underline"
                  >
                    {character.name}
                  </Link>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    Level {character.level} {character.class}
                    {character.race ? ` · ${character.race}` : ""}
                  </p>
                  {showOwner ? (
                    <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
                      Owner: {character.user.name ?? character.user.email}
                    </p>
                  ) : null}
                </div>

                <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
                  AC {character.armorClass}
                </span>
              </div>

              <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
                HP {character.currentHp}/{character.maxHp}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-sm text-[color:var(--muted-foreground)]">
          No characters yet. Create one to start tracking your sheet in the app.
        </div>
      )}
    </section>
  );
}
