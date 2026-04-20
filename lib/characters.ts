import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const SPELL_SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type CharacterListItem = Prisma.CharacterGetPayload<{
  select: {
    id: true;
    name: true;
    class: true;
    level: true;
    race: true;
    currentHp: true;
    maxHp: true;
    armorClass: true;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export type CharacterDetail = Prisma.CharacterGetPayload<{
  select: {
    id: true;
    name: true;
    userId: true;
    class: true;
    level: true;
    race: true;
    background: true;
    strength: true;
    dexterity: true;
    constitution: true;
    intelligence: true;
    wisdom: true;
    charisma: true;
    maxHp: true;
    currentHp: true;
    temporaryHp: true;
    armorClass: true;
    spellSlots: true;
    conditions: true;
    inventory: true;
    notes: true;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
      };
    };
    preparedSpells: {
      select: {
        id: true;
        name: true;
        level: true;
        school: true;
      };
    };
  };
}>;

export type CharacterSpellOption = Prisma.SpellGetPayload<{
  select: {
    id: true;
    name: true;
    level: true;
    school: true;
  };
}>;

export type CharacterCreateInput = {
  name: string;
  className: string;
  level: number;
};

export type CharacterUpdateInput = {
  name: string;
  className: string;
  level: number;
  race: string;
  background: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  armorClass: number;
  spellSlots: Record<string, number>;
  preparedSpellIds: string[];
  conditions: string[];
  inventory: string[];
  notes: string;
};

export class CharacterAccessError extends Error {
  constructor() {
    super("Only the character owner can edit this sheet.");
    this.name = "CharacterAccessError";
  }
}

export class CharacterNotFoundError extends Error {
  constructor() {
    super("Character not found.");
    this.name = "CharacterNotFoundError";
  }
}

const CHARACTER_LIST_SELECT = {
  id: true,
  name: true,
  class: true,
  level: true,
  race: true,
  currentHp: true,
  maxHp: true,
  armorClass: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.CharacterSelect;

const CHARACTER_DETAIL_SELECT = {
  id: true,
  name: true,
  userId: true,
  class: true,
  level: true,
  race: true,
  background: true,
  strength: true,
  dexterity: true,
  constitution: true,
  intelligence: true,
  wisdom: true,
  charisma: true,
  maxHp: true,
  currentHp: true,
  temporaryHp: true,
  armorClass: true,
  spellSlots: true,
  conditions: true,
  inventory: true,
  notes: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  preparedSpells: {
    select: {
      id: true,
      name: true,
      level: true,
      school: true,
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  },
} satisfies Prisma.CharacterSelect;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function createDefaultSpellSlots(): Record<string, number> {
  return Object.fromEntries(SPELL_SLOT_LEVELS.map((level) => [`level${level}`, 0]));
}

export function canViewAllCharacters(role: Role | null | undefined) {
  return role === Role.DM || role === Role.ADMIN;
}

export function canEditCharacter(characterUserId: string, viewerUserId: string | null | undefined) {
  return Boolean(viewerUserId && characterUserId === viewerUserId);
}

export function normalizeStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

export function normalizeSpellSlots(value: Prisma.JsonValue | null | undefined): Record<string, number> {
  const defaults = createDefaultSpellSlots();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults;
  }

  const record = value as Record<string, unknown>;

  for (const level of SPELL_SLOT_LEVELS) {
    const key = `level${level}`;
    const rawValue = Number(record[key] ?? defaults[key]);
    defaults[key] = Number.isNaN(rawValue) ? 0 : clamp(rawValue, 0, 99);
  }

  return defaults;
}

export async function listCharactersForViewer(viewerId: string, viewerRole: Role): Promise<CharacterListItem[]> {
  return prisma.character.findMany({
    select: CHARACTER_LIST_SELECT,
    where: canViewAllCharacters(viewerRole) ? undefined : { userId: viewerId },
    orderBy: [{ name: "asc" }],
  });
}

export async function findCharacterForViewer(
  characterId: string,
  viewerId: string,
  viewerRole: Role,
): Promise<CharacterDetail | null> {
  return prisma.character.findFirst({
    select: CHARACTER_DETAIL_SELECT,
    where: canViewAllCharacters(viewerRole)
      ? { id: characterId }
      : {
          id: characterId,
          userId: viewerId,
        },
  });
}

export async function listCharacterSpellOptions(): Promise<CharacterSpellOption[]> {
  return prisma.spell.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      school: true,
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });
}

export async function createCharacterForUser(userId: string, input: CharacterCreateInput) {
  const level = clamp(input.level, 1, 20);

  return prisma.character.create({
    data: {
      name: input.name.trim(),
      class: input.className.trim(),
      level,
      race: "",
      background: "",
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      maxHp: 10,
      currentHp: 10,
      temporaryHp: 0,
      armorClass: 10,
      spellSlots: createDefaultSpellSlots(),
      conditions: [],
      inventory: [],
      notes: "",
      user: {
        connect: { id: userId },
      },
    },
  });
}

export async function updateCharacterForUser(userId: string, characterId: string, input: CharacterUpdateInput) {
  const existingCharacter = await prisma.character.findUnique({
    where: { id: characterId },
    select: {
      userId: true,
    },
  });

  if (!existingCharacter) {
    throw new CharacterNotFoundError();
  }

  if (!canEditCharacter(existingCharacter.userId, userId)) {
    throw new CharacterAccessError();
  }

  const preparedSpellIds = Array.from(new Set(input.preparedSpellIds));

  return prisma.character.update({
    where: { id: characterId },
    data: {
      name: input.name.trim(),
      class: input.className.trim(),
      level: clamp(input.level, 1, 20),
      race: input.race.trim(),
      background: input.background.trim(),
      strength: clamp(input.strength, 1, 30),
      dexterity: clamp(input.dexterity, 1, 30),
      constitution: clamp(input.constitution, 1, 30),
      intelligence: clamp(input.intelligence, 1, 30),
      wisdom: clamp(input.wisdom, 1, 30),
      charisma: clamp(input.charisma, 1, 30),
      maxHp: clamp(input.maxHp, 0, 999),
      currentHp: clamp(input.currentHp, 0, 999),
      temporaryHp: clamp(input.temporaryHp, 0, 999),
      armorClass: clamp(input.armorClass, 0, 99),
      spellSlots: input.spellSlots,
      conditions: input.conditions,
      inventory: input.inventory,
      notes: input.notes.trim(),
      preparedSpells: {
        set: preparedSpellIds.map((spellId) => ({ id: spellId })),
      },
    },
  });
}
