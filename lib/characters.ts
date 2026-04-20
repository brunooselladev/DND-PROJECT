import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const SPELL_SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type SpellSlotLevelKey = `level${(typeof SPELL_SLOT_LEVELS)[number]}`;

export type SpellSlotBand = {
  max: number;
  used: number;
};

export type SpellSlotsState = Record<SpellSlotLevelKey, SpellSlotBand>;

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
    avatarUrl: true;
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
    deathSaveSuccesses: true;
    deathSaveFailures: true;
    hitDiceTotal: true;
    hitDiceSpent: true;
    lastLongRestAt: true;
    spellSlots: {
      select: {
        level: true;
        max: true;
        used: true;
      };
    };
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
        spell: {
          select: {
            id: true;
            name: true;
            level: true;
            school: true;
          };
        };
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
  avatarUrl: string | null;
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
  spellSlots: SpellSlotsState;
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
  avatarUrl: true,
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
  deathSaveSuccesses: true,
  deathSaveFailures: true,
  hitDiceTotal: true,
  hitDiceSpent: true,
  lastLongRestAt: true,
  spellSlots: {
    select: {
      level: true,
      max: true,
      used: true,
    },
    orderBy: [{ level: "asc" }],
  },
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
      spell: {
        select: {
          id: true,
          name: true,
          level: true,
          school: true,
        },
      },
    },
    orderBy: [{ spell: { level: "asc" } }, { spell: { name: "asc" } }],
  },
} satisfies Prisma.CharacterSelect;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function createDefaultSpellSlots(): SpellSlotsState {
  return Object.fromEntries(
    SPELL_SLOT_LEVELS.map((level) => {
      const key = `level${level}` as SpellSlotLevelKey;
      return [key, { max: 0, used: 0 } satisfies SpellSlotBand];
    }),
  ) as SpellSlotsState;
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

export function spellSlotRowsToState(
  rows: Array<{ level: number; max: number; used: number }> | null | undefined,
): SpellSlotsState {
  const defaults = createDefaultSpellSlots();

  if (!rows) {
    return defaults;
  }

  for (const row of rows) {
    if (!SPELL_SLOT_LEVELS.includes(row.level as (typeof SPELL_SLOT_LEVELS)[number])) {
      continue;
    }
    const key = `level${row.level}` as SpellSlotLevelKey;
    const max = clamp(Number(row.max) || 0, 0, 99);
    const used = clamp(Number(row.used) || 0, 0, max);
    defaults[key] = { max, used };
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
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      hitDiceTotal: level,
      hitDiceSpent: 0,
      lastLongRestAt: null,
      spellSlots: {
        create: SPELL_SLOT_LEVELS.map((slotLevel) => ({
          level: slotLevel,
          max: 0,
          used: 0,
        })),
      },
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

  const nextLevel = clamp(input.level, 1, 20);
  const nextMaxHp = clamp(input.maxHp, 0, 999);
  const nextCurrentHp = clamp(input.currentHp, 0, 999);

  return prisma.$transaction(async (tx) => {
    const previous = await tx.character.findUnique({
      where: { id: characterId },
      select: { hitDiceSpent: true },
    });

    const previousSpent = previous?.hitDiceSpent ?? 0;
    const nextHitDiceSpent = clamp(previousSpent, 0, nextLevel);

    const updated = await tx.character.update({
      where: { id: characterId },
      data: {
        name: input.name.trim(),
        class: input.className.trim(),
        level: nextLevel,
        race: input.race.trim(),
        background: input.background.trim(),
        avatarUrl: input.avatarUrl,
        strength: clamp(input.strength, 1, 30),
        dexterity: clamp(input.dexterity, 1, 30),
        constitution: clamp(input.constitution, 1, 30),
        intelligence: clamp(input.intelligence, 1, 30),
        wisdom: clamp(input.wisdom, 1, 30),
        charisma: clamp(input.charisma, 1, 30),
        maxHp: nextMaxHp,
        currentHp: clamp(nextCurrentHp, 0, nextMaxHp),
        temporaryHp: clamp(input.temporaryHp, 0, 999),
        armorClass: clamp(input.armorClass, 0, 99),
        hitDiceTotal: nextLevel,
        hitDiceSpent: nextHitDiceSpent,
        conditions: input.conditions,
        inventory: input.inventory,
        notes: input.notes.trim(),
      },
    });

    await tx.preparedSpell.deleteMany({
      where: { characterId },
    });
    if (preparedSpellIds.length > 0) {
      await tx.preparedSpell.createMany({
        data: preparedSpellIds.map((spellId) => ({
          characterId,
          spellId,
        })),
        skipDuplicates: true,
      });
    }

    for (const level of SPELL_SLOT_LEVELS) {
      const key = `level${level}` as SpellSlotLevelKey;
      const band = input.spellSlots[key] ?? { max: 0, used: 0 };
      const max = clamp(band.max, 0, 99);
      const existing = await tx.spellSlot.findUnique({
        where: { characterId_level: { characterId, level } },
        select: { used: true },
      });
      const used = clamp(existing?.used ?? clamp(band.used, 0, max), 0, max);
      await tx.spellSlot.upsert({
        where: {
          characterId_level: {
            characterId,
            level,
          },
        },
        create: {
          characterId,
          level,
          max,
          used,
        },
        update: {
          max,
          used,
        },
      });
    }

    return updated;
  });
}

export type CharacterGameplaySnapshot = {
  currentHp: number;
  maxHp: number;
  temporaryHp: number;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  hitDiceTotal: number;
  hitDiceSpent: number;
  lastLongRestAt: Date | null;
};

function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function getHitDieSidesForClass(className: string) {
  const normalized = className.trim().toLowerCase();

  if (normalized.includes("barbar")) return 12;
  if (normalized.includes("fighter") || normalized.includes("guerr") || normalized.includes("palad") || normalized.includes("ranger")) return 10;
  if (
    normalized.includes("bard") ||
    normalized.includes("cler") ||
    normalized.includes("clér") ||
    normalized.includes("druid") ||
    normalized.includes("monk") ||
    normalized.includes("rogue") ||
    normalized.includes("pícar") ||
    normalized.includes("warlock") ||
    normalized.includes("brujo")
  )
    return 8;
  if (normalized.includes("sorc") || normalized.includes("hechic") || normalized.includes("wizard") || normalized.includes("mago")) return 6;

  return 8;
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

async function assertCanEditCharacterOrThrow(userId: string, characterId: string) {
  const existing = await prisma.character.findUnique({
    where: { id: characterId },
    select: { userId: true },
  });

  if (!existing) {
    throw new CharacterNotFoundError();
  }

  if (!canEditCharacter(existing.userId, userId)) {
    throw new CharacterAccessError();
  }
}

export async function getCharacterGameplaySnapshotForUser(
  userId: string,
  characterId: string,
): Promise<CharacterGameplaySnapshot> {
  await assertCanEditCharacterOrThrow(userId, characterId);

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: {
      currentHp: true,
      maxHp: true,
      temporaryHp: true,
      deathSaveSuccesses: true,
      deathSaveFailures: true,
      hitDiceTotal: true,
      hitDiceSpent: true,
      lastLongRestAt: true,
    },
  });

  if (!character) {
    throw new CharacterNotFoundError();
  }

  return character;
}

export async function applyDamageForUser(userId: string, characterId: string, damage: number) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  const amount = clamp(Number(damage) || 0, 0, 9999);
  if (amount === 0) {
    return getCharacterGameplaySnapshotForUser(userId, characterId);
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.character.findUnique({
      where: { id: characterId },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });

    if (!current) {
      throw new CharacterNotFoundError();
    }

    const absorbed = Math.min(current.temporaryHp, amount);
    const remaining = amount - absorbed;
    const nextTemp = current.temporaryHp - absorbed;
    const nextHp = clamp(current.currentHp - remaining, 0, current.maxHp);
    const droppedToZero = current.currentHp > 0 && nextHp === 0;

    const updated = await tx.character.update({
      where: { id: characterId },
      data: {
        temporaryHp: nextTemp,
        currentHp: nextHp,
        ...(droppedToZero ? { deathSaveSuccesses: 0, deathSaveFailures: 0 } : null),
      },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });

    return updated;
  });
}

export async function healForUser(userId: string, characterId: string, amount: number) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  const healAmount = clamp(Number(amount) || 0, 0, 9999);
  if (healAmount === 0) {
    return getCharacterGameplaySnapshotForUser(userId, characterId);
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.character.findUnique({
      where: { id: characterId },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });

    if (!current) {
      throw new CharacterNotFoundError();
    }

    const nextHp = clamp(current.currentHp + healAmount, 0, current.maxHp);
    const shouldResetDeathSaves = nextHp > 0 && (current.deathSaveFailures > 0 || current.deathSaveSuccesses > 0);

    return tx.character.update({
      where: { id: characterId },
      data: {
        currentHp: nextHp,
        ...(shouldResetDeathSaves ? { deathSaveSuccesses: 0, deathSaveFailures: 0 } : null),
      },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });
  });
}

export async function recordDeathSaveForUser(
  userId: string,
  characterId: string,
  result: "success" | "failure",
) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  return prisma.$transaction(async (tx) => {
    const current = await tx.character.findUnique({
      where: { id: characterId },
      select: {
        currentHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        maxHp: true,
        temporaryHp: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });

    if (!current) {
      throw new CharacterNotFoundError();
    }

    if (current.currentHp > 0) {
      return tx.character.update({
        where: { id: characterId },
        data: { deathSaveSuccesses: 0, deathSaveFailures: 0 },
        select: {
          currentHp: true,
          maxHp: true,
          temporaryHp: true,
          deathSaveSuccesses: true,
          deathSaveFailures: true,
          hitDiceTotal: true,
          hitDiceSpent: true,
          lastLongRestAt: true,
        },
      });
    }

    const nextSuccesses =
      result === "success" ? clamp(current.deathSaveSuccesses + 1, 0, 3) : current.deathSaveSuccesses;
    const nextFailures =
      result === "failure" ? clamp(current.deathSaveFailures + 1, 0, 3) : current.deathSaveFailures;

    return tx.character.update({
      where: { id: characterId },
      data: {
        deathSaveSuccesses: nextSuccesses,
        deathSaveFailures: nextFailures,
      },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });
  });
}

export async function shortRestForUser(userId: string, characterId: string, hitDiceToSpend: number) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  const spend = clamp(Number(hitDiceToSpend) || 0, 0, 99);

  return prisma.$transaction(async (tx) => {
    const character = await tx.character.findUnique({
      where: { id: characterId },
      select: {
        class: true,
        constitution: true,
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        lastLongRestAt: true,
      },
    });

    if (!character) {
      throw new CharacterNotFoundError();
    }

    const available = clamp(character.hitDiceTotal - character.hitDiceSpent, 0, character.hitDiceTotal);
    const actualSpend = clamp(spend, 0, available);
    const dieSides = getHitDieSidesForClass(character.class);
    const conMod = getAbilityModifier(character.constitution);

    let healed = 0;
    for (let i = 0; i < actualSpend; i += 1) {
      healed += Math.max(0, rollDie(dieSides) + conMod);
    }

    const nextHp = clamp(character.currentHp + healed, 0, character.maxHp);

    return tx.character.update({
      where: { id: characterId },
      data: {
        currentHp: nextHp,
        hitDiceSpent: character.hitDiceSpent + actualSpend,
        ...(nextHp > 0 ? { deathSaveSuccesses: 0, deathSaveFailures: 0 } : null),
      },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });
  });
}

export async function longRestForUser(userId: string, characterId: string) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  return prisma.$transaction(async (tx) => {
    const current = await tx.character.findUnique({
      where: { id: characterId },
      select: {
        maxHp: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
        currentHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
      },
    });

    if (!current) {
      throw new CharacterNotFoundError();
    }

    const now = new Date();
    if (current.lastLongRestAt) {
      const elapsedMs = now.getTime() - current.lastLongRestAt.getTime();
      if (elapsedMs < 24 * 60 * 60 * 1000) {
        throw new Error("You can only benefit from one long rest every 24 hours.");
      }
    }

    const recoveredDice = Math.max(1, Math.floor(current.hitDiceTotal / 2));
    const nextHitDiceSpent = clamp(current.hitDiceSpent - recoveredDice, 0, current.hitDiceTotal);

    await tx.spellSlot.updateMany({
      where: { characterId },
      data: { used: 0 },
    });

    return tx.character.update({
      where: { id: characterId },
      data: {
        currentHp: current.maxHp,
        temporaryHp: 0,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        hitDiceSpent: nextHitDiceSpent,
        lastLongRestAt: now,
        conditions: [],
      },
      select: {
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        deathSaveSuccesses: true,
        deathSaveFailures: true,
        hitDiceTotal: true,
        hitDiceSpent: true,
        lastLongRestAt: true,
      },
    });
  });
}

export async function consumeSpellSlotForUser(userId: string, characterId: string, level: number) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  const slotLevel = clamp(Number(level) || 0, 1, 9);

  return prisma.$transaction(async (tx) => {
    const result = await tx.$queryRaw<Array<{ max: number; used: number }>>(
      Prisma.sql`UPDATE "SpellSlot"
      SET "used" = "used" + 1
      WHERE "characterId" = ${characterId} AND "level" = ${slotLevel} AND "used" < "max"
      RETURNING "max", "used"`,
    );

    if (result.length === 0) {
      const current = await tx.spellSlot.findUnique({
        where: { characterId_level: { characterId, level: slotLevel } },
        select: { max: true, used: true },
      });
      return current ?? { max: 0, used: 0 };
    }

    return result[0];
  });
}

export async function restoreSpellSlotForUser(userId: string, characterId: string, level: number) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  const slotLevel = clamp(Number(level) || 0, 1, 9);

  return prisma.$transaction(async (tx) => {
    const result = await tx.$queryRaw<Array<{ max: number; used: number }>>(
      Prisma.sql`UPDATE "SpellSlot"
      SET "used" = "used" - 1
      WHERE "characterId" = ${characterId} AND "level" = ${slotLevel} AND "used" > 0
      RETURNING "max", "used"`,
    );

    if (result.length === 0) {
      const current = await tx.spellSlot.findUnique({
        where: { characterId_level: { characterId, level: slotLevel } },
        select: { max: true, used: true },
      });
      return current ?? { max: 0, used: 0 };
    }

    return result[0];
  });
}

export async function setSpellSlotMaxForUser(userId: string, characterId: string, level: number, max: number) {
  await assertCanEditCharacterOrThrow(userId, characterId);
  const slotLevel = clamp(Number(level) || 0, 1, 9);
  const nextMax = clamp(Number(max) || 0, 0, 99);

  return prisma.$transaction(async (tx) => {
    const current = await tx.spellSlot.findUnique({
      where: { characterId_level: { characterId, level: slotLevel } },
      select: { used: true },
    });

    const nextUsed = clamp(current?.used ?? 0, 0, nextMax);

    return tx.spellSlot.upsert({
      where: { characterId_level: { characterId, level: slotLevel } },
      create: { characterId, level: slotLevel, max: nextMax, used: nextUsed },
      update: { max: nextMax, used: nextUsed },
      select: { max: true, used: true, level: true },
    });
  });
}

export async function togglePreparedSpellForUser(
  userId: string,
  characterId: string,
  spellId: string,
  prepared: boolean,
) {
  await assertCanEditCharacterOrThrow(userId, characterId);

  if (prepared) {
    await prisma.preparedSpell.create({
      data: { characterId, spellId },
    }).catch(() => null);
  } else {
    await prisma.preparedSpell.deleteMany({
      where: { characterId, spellId },
    });
  }

  const next = await prisma.preparedSpell.findMany({
    where: { characterId },
    select: { spellId: true },
  });

  return next.map((row) => row.spellId);
}
