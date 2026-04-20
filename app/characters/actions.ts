"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  CharacterAccessError,
  CharacterNotFoundError,
  SPELL_SLOT_LEVELS,
  createCharacterForUser,
  createDefaultSpellSlots,
  updateCharacterForUser,
} from "@/lib/characters";
import { getCurrentUser } from "@/lib/auth";

export type CharacterActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_CHARACTER_ACTION_STATE: CharacterActionState = {
  status: "idle",
};

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
  const spellSlots = createDefaultSpellSlots();

  for (const level of SPELL_SLOT_LEVELS) {
    const key = `level${level}`;
    const value = Number(formData.get(key) ?? 0);
    spellSlots[key] = Number.isNaN(value) ? 0 : Math.max(0, value);
  }

  return spellSlots;
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
