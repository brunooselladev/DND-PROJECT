import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CharacterSheetForm } from "@/components/character-sheet-form";
import { getCurrentUser } from "@/lib/auth";
import {
  canEditCharacter,
  findCharacterForViewer,
  listCharacterSpellOptions,
  spellSlotRowsToState,
  normalizeStringArray,
} from "@/lib/characters";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CharacterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?callbackUrl=/characters/${id}`);
  }

  const [character, spells] = await Promise.all([
    findCharacterForViewer(id, currentUser.id, currentUser.role),
    listCharacterSpellOptions(),
  ]);

  if (!character) {
    notFound();
  }

  const canEdit = canEditCharacter(character.userId, currentUser.id);
  const ownerName = character.user.name ?? character.user.email;

  return (
    <section className="space-y-5">
      <Link href="/characters" className="text-sm text-[color:var(--accent-strong)] hover:underline">
        ← Back to characters
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[color:var(--foreground)]">{character.name}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Level {character.level} {character.class}
            {character.race ? ` · ${character.race}` : ""}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
            Owner: {ownerName}
          </p>
        </div>

        <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-xs uppercase text-[color:var(--muted-foreground)]">
          {canEdit ? "Editable" : "View only"}
        </span>
      </header>

      <CharacterSheetForm
        canEdit={canEdit}
        spells={spells}
        initialCharacter={{
          id: character.id,
          name: character.name,
          class: character.class,
          level: character.level,
          race: character.race,
          background: character.background,
          strength: character.strength,
          dexterity: character.dexterity,
          constitution: character.constitution,
          intelligence: character.intelligence,
          wisdom: character.wisdom,
          charisma: character.charisma,
          maxHp: character.maxHp,
          currentHp: character.currentHp,
          temporaryHp: character.temporaryHp,
          armorClass: character.armorClass,
          deathSaveSuccesses: character.deathSaveSuccesses,
          deathSaveFailures: character.deathSaveFailures,
          hitDiceTotal: character.hitDiceTotal,
          hitDiceSpent: character.hitDiceSpent,
          spellSlots: spellSlotRowsToState(character.spellSlots),
          preparedSpellIds: character.preparedSpells.map((entry) => entry.spell.id),
          conditionsText: normalizeStringArray(character.conditions).join("\n"),
          inventoryText: normalizeStringArray(character.inventory).join("\n"),
          notes: character.notes,
        }}
      />
    </section>
  );
}
