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

      <CharacterSheetForm
        canEdit={canEdit}
        spells={spells}
        ownerName={ownerName}
        initialCharacter={{
          id: character.id,
          name: character.name,
          class: character.class,
          level: character.level,
          race: character.race,
          background: character.background,
          avatarUrl: character.avatarUrl,
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
