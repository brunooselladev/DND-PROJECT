"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  CharacterAccessError,
  CharacterNotFoundError,
  SPELL_SLOT_LEVELS,
  createCharacterForUser,
  applyDamageForUser,
  healForUser,
  longRestForUser,
  recordDeathSaveForUser,
  restoreSpellSlotForUser,
  setSpellSlotMaxForUser,
  shortRestForUser,
  togglePreparedSpellForUser,
  consumeSpellSlotForUser,
  createDefaultSpellSlots,
  type SpellSlotLevelKey,
  updateCharacterForUser,
} from "@/lib/characters";
import { getCurrentUser } from "@/lib/auth";

import type { CharacterActionState } from "@/app/characters/action-state";

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseInteger(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key) ?? fallback);
  return Number.isNaN(value) ? fallback : value;
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseSpellSlots(formData: FormData) {
  const slots = createDefaultSpellSlots();

  for (const level of SPELL_SLOT_LEVELS) {
    const key = `level${level}` as SpellSlotLevelKey;
    const max = Number(formData.get(`${key}Max`) ?? 0);
    const used = Number(formData.get(`${key}Used`) ?? 0);
    const nextMax = Number.isNaN(max) ? 0 : Math.max(0, Math.min(99, max));
    const nextUsed = Number.isNaN(used) ? 0 : Math.max(0, Math.min(nextMax, used));
    slots[key] = { max: nextMax, used: nextUsed };
  }

  return slots;
}

export async function createCharacterAction(
  _previousState: CharacterActionState,
  formData: FormData,
): Promise<CharacterActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/characters/new");
  }

  const name = parseText(formData, "name");
  const className = parseText(formData, "class");
  const level = parseInteger(formData, "level", 1);

  if (!name || !className) {
    return {
      status: "error",
      message: "Name and class are required.",
    };
  }

  const character = await createCharacterForUser(currentUser.id, {
    name,
    className,
    level,
  });

  revalidatePath("/characters");
  redirect(`/characters/${character.id}`);
}

export async function updateCharacterAction(
  _previousState: CharacterActionState,
  formData: FormData,
): Promise<CharacterActionState> {
  const currentUser = await getCurrentUser();
  const characterId = parseText(formData, "characterId");

  if (!currentUser) {
    redirect(`/login?callbackUrl=/characters/${characterId}`);
  }

  if (!characterId) {
    return {
      status: "error",
      message: "Missing character id.",
    };
  }

  const name = parseText(formData, "name");
  const className = parseText(formData, "class");

  if (!name || !className) {
    return {
      status: "error",
      message: "Name and class are required.",
    };
  }

  try {
    await updateCharacterForUser(currentUser.id, characterId, {
      name,
      className,
      level: parseInteger(formData, "level", 1),
      race: parseText(formData, "race"),
      background: parseText(formData, "background"),
      strength: parseInteger(formData, "strength", 10),
      dexterity: parseInteger(formData, "dexterity", 10),
      constitution: parseInteger(formData, "constitution", 10),
      intelligence: parseInteger(formData, "intelligence", 10),
      wisdom: parseInteger(formData, "wisdom", 10),
      charisma: parseInteger(formData, "charisma", 10),
      maxHp: parseInteger(formData, "maxHp", 10),
      currentHp: parseInteger(formData, "currentHp", 10),
      temporaryHp: parseInteger(formData, "temporaryHp", 0),
      armorClass: parseInteger(formData, "armorClass", 10),
      spellSlots: parseSpellSlots(formData),
      preparedSpellIds: formData.getAll("preparedSpellIds").map(String),
      conditions: parseLines(parseText(formData, "conditionsText")),
      inventory: parseLines(parseText(formData, "inventoryText")),
      notes: parseText(formData, "notes"),
    });

    revalidatePath("/characters");
    revalidatePath(`/characters/${characterId}`);

    return {
      status: "success",
      message: "Character saved.",
    };
  } catch (error) {
    if (error instanceof CharacterAccessError || error instanceof CharacterNotFoundError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    throw error;
  }
}

type GameplayActionResult =
  | { ok: true; snapshot: Awaited<ReturnType<typeof longRestForUser>> }
  | {
      ok: false;
      message: string;
    };

async function requireUserAndCharacterId(characterId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?callbackUrl=/characters/${characterId}`);
  }
  return currentUser;
}

export async function applyDamageAction(characterId: string, damage: number) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const snapshot = await applyDamageForUser(currentUser.id, characterId, damage);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return snapshot;
}

export async function healAction(characterId: string, amount: number) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const snapshot = await healForUser(currentUser.id, characterId, amount);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return snapshot;
}

export async function longRestAction(characterId: string): Promise<GameplayActionResult> {
  const currentUser = await requireUserAndCharacterId(characterId);
  try {
    const snapshot = await longRestForUser(currentUser.id, characterId);
    revalidatePath("/characters");
    revalidatePath(`/characters/${characterId}`);
    return { ok: true, snapshot };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Long rest failed." };
  }
}

export async function shortRestAction(characterId: string, hitDiceToSpend: number) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const snapshot = await shortRestForUser(currentUser.id, characterId, hitDiceToSpend);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return snapshot;
}

export async function recordDeathSaveAction(characterId: string, result: "success" | "failure") {
  const currentUser = await requireUserAndCharacterId(characterId);
  const snapshot = await recordDeathSaveForUser(currentUser.id, characterId, result);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return snapshot;
}

export async function consumeSpellSlotAction(characterId: string, level: number) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const slot = await consumeSpellSlotForUser(currentUser.id, characterId, level);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return slot;
}

export async function restoreSpellSlotAction(characterId: string, level: number) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const slot = await restoreSpellSlotForUser(currentUser.id, characterId, level);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return slot;
}

export async function setSpellSlotMaxAction(characterId: string, level: number, max: number) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const slot = await setSpellSlotMaxForUser(currentUser.id, characterId, level, max);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return slot;
}

export async function togglePreparedSpellAction(characterId: string, spellId: string, prepared: boolean) {
  const currentUser = await requireUserAndCharacterId(characterId);
  const preparedIds = await togglePreparedSpellForUser(currentUser.id, characterId, spellId, prepared);
  revalidatePath("/characters");
  revalidatePath(`/characters/${characterId}`);
  return preparedIds;
}
