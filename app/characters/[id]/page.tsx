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
    <section className="space-y-6">
      <Link href="/characters" className="text-sm font-semibold text-[color:var(--accent-strong)] hover:text-[color:var(--accent-glow)] transition-colors">
        ← Back to characters
      </Link>

      <header className="relative overflow-hidden rounded-md border-2 border-[color:var(--border)] bg-[color:var(--background)] shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--background)] via-[color:var(--background)] to-transparent z-10 md:w-2/3" />
        <div className="absolute inset-0 z-0 flex justify-end">
          <img src="/hero_wizard.png" alt="Character art" className="h-full w-full object-cover md:w-1/2 object-top opacity-80" />
        </div>
        
        <div className="relative z-20 p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[color:var(--foreground)] drop-shadow-sm">{character.name}</h1>
            <p className="mt-2 text-lg font-display text-[color:var(--muted-foreground)]">
              Level {character.level} {character.class}
              {character.race ? ` · ${character.race}` : ""}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] font-semibold text-[color:var(--accent-strong)]">
              Owner: {ownerName}
            </p>
          </div>

          <span className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs uppercase font-bold text-[color:var(--muted-foreground)] shadow-sm">
            {canEdit ? "Editable" : "View only"}
          </span>
        </div>
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
