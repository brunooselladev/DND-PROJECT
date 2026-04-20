"use client";

import { useActionState, useDeferredValue, useState } from "react";

import {
  INITIAL_CHARACTER_ACTION_STATE,
  updateCharacterAction,
} from "@/app/characters/actions";
import { SPELL_SLOT_LEVELS } from "@/lib/characters";

type SpellOption = {
  id: string;
  name: string;
  level: number;
  school: string;
};

type CharacterSheetValue = {
  id: string;
  name: string;
  class: string;
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
  conditionsText: string;
  inventoryText: string;
  notes: string;
};

type CharacterSheetFormProps = {
  initialCharacter: CharacterSheetValue;
  spells: SpellOption[];
  canEdit: boolean;
};

export function CharacterSheetForm({
  initialCharacter,
  spells,
  canEdit,
}: CharacterSheetFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCharacterAction,
    INITIAL_CHARACTER_ACTION_STATE,
  );
  const [formValues, setFormValues] = useState(initialCharacter);
  const [spellSearch, setSpellSearch] = useState("");
  const deferredSpellSearch = useDeferredValue(spellSearch);

  const hpPercent =
    formValues.maxHp > 0
      ? Math.min(100, Math.max(0, Math.round((formValues.currentHp / formValues.maxHp) * 100)))
      : 0;

  const filteredSpells = spells.filter((spell) => {
    if (!deferredSpellSearch.trim()) {
      return true;
    }

    const query = deferredSpellSearch.trim().toLowerCase();
    return (
      spell.name.toLowerCase().includes(query) ||
      spell.school.toLowerCase().includes(query) ||
      String(spell.level).includes(query)
    );
  });

  function updateNumberField(field: keyof CharacterSheetValue, value: number) {
    setFormValues((current) => ({
      ...current,
      [field]: Number.isNaN(value) ? 0 : value,
    }));
  }

  function updateTextField(field: keyof CharacterSheetValue, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSpellSlot(level: number, value: number) {
    const key = `level${level}`;

    setFormValues((current) => ({
      ...current,
      spellSlots: {
        ...current.spellSlots,
        [key]: Number.isNaN(value) ? 0 : Math.max(0, value),
      },
    }));
  }

  function togglePreparedSpell(spellId: string, checked: boolean) {
    setFormValues((current) => ({
      ...current,
      preparedSpellIds: checked
        ? Array.from(new Set([...current.preparedSpellIds, spellId]))
        : current.preparedSpellIds.filter((id) => id !== spellId),
    }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="characterId" value={formValues.id} />
      {formValues.preparedSpellIds.map((spellId) => (
        <input key={spellId} type="hidden" name="preparedSpellIds" value={spellId} />
      ))}

      {!canEdit ? (
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--muted-foreground)]">
          This sheet is view-only because only the character owner can edit it.
        </div>
      ) : null}

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Basics</h2>
        </div>

        <label className="grid gap-2 text-sm">
          <span>Name</span>
          <input
            disabled={!canEdit}
            name="name"
            value={formValues.name}
            onChange={(event) => updateTextField("name", event.target.value)}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span>Class</span>
          <input
            disabled={!canEdit}
            name="class"
            value={formValues.class}
            onChange={(event) => updateTextField("class", event.target.value)}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span>Level</span>
          <input
            disabled={!canEdit}
            min={1}
            max={20}
            type="number"
            name="level"
            value={formValues.level}
            onChange={(event) => updateNumberField("level", Number(event.target.value))}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span>Race</span>
          <input
            disabled={!canEdit}
            name="race"
            value={formValues.race}
            onChange={(event) => updateTextField("race", event.target.value)}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
          />
        </label>

        <label className="grid gap-2 text-sm md:col-span-2">
          <span>Background</span>
          <input
            disabled={!canEdit}
            name="background"
            value={formValues.background}
            onChange={(event) => updateTextField("background", event.target.value)}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
          />
        </label>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-5">
          <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Stats</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["strength", "Strength"],
                ["dexterity", "Dexterity"],
                ["constitution", "Constitution"],
                ["intelligence", "Intelligence"],
                ["wisdom", "Wisdom"],
                ["charisma", "Charisma"],
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm">
                  <span>{label}</span>
                  <input
                    disabled={!canEdit}
                    min={1}
                    max={30}
                    type="number"
                    name={key}
                    value={formValues[key as keyof CharacterSheetValue] as number}
                    onChange={(event) =>
                      updateNumberField(
                        key as keyof CharacterSheetValue,
                        Number(event.target.value),
                      )
                    }
                    className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Spells</h2>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  Prepared {formValues.preparedSpellIds.length} of {spells.length} available spells.
                </p>
              </div>

              <input
                value={spellSearch}
                onChange={(event) => setSpellSearch(event.target.value)}
                placeholder="Search spells"
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm md:w-64"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {SPELL_SLOT_LEVELS.map((level) => {
                const key = `level${level}`;

                return (
                  <label key={key} className="grid gap-2 text-sm">
                    <span>Level {level} slots</span>
                    <input
                      disabled={!canEdit}
                      min={0}
                      max={99}
                      type="number"
                      name={key}
                      value={formValues.spellSlots[key] ?? 0}
                      onChange={(event) => updateSpellSlot(level, Number(event.target.value))}
                      className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
              {filteredSpells.length > 0 ? (
                filteredSpells.map((spell) => {
                  const checked = formValues.preparedSpellIds.includes(spell.id);

                  return (
                    <label
                      key={spell.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-[color:var(--surface)] px-3 py-2 text-sm"
                    >
                      <span>
                        {spell.name}
                        <span className="ml-2 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
                          Level {spell.level} {spell.school}
                        </span>
                      </span>
                      <input
                        disabled={!canEdit}
                        checked={checked}
                        type="checkbox"
                        onChange={(event) => togglePreparedSpell(spell.id, event.target.checked)}
                      />
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">No spells match your search.</p>
              )}
            </div>
          </article>
        </div>

        <div className="space-y-5">
          <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Combat</h2>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[color:var(--surface-soft)]">
              <div
                className="h-full rounded-full bg-[color:var(--accent-strong)] transition-all"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              {formValues.currentHp} / {formValues.maxHp} HP with {formValues.temporaryHp} temporary HP.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["maxHp", "Max HP"],
                ["currentHp", "Current HP"],
                ["temporaryHp", "Temporary HP"],
                ["armorClass", "Armor Class"],
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm">
                  <span>{label}</span>
                  <input
                    disabled={!canEdit}
                    min={0}
                    type="number"
                    name={key}
                    value={formValues[key as keyof CharacterSheetValue] as number}
                    onChange={(event) =>
                      updateNumberField(
                        key as keyof CharacterSheetValue,
                        Number(event.target.value),
                      )
                    }
                    className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Notes</h2>

            <div className="mt-4 space-y-4">
              <label className="grid gap-2 text-sm">
                <span>Conditions</span>
                <textarea
                  disabled={!canEdit}
                  name="conditionsText"
                  value={formValues.conditionsText}
                  onChange={(event) => updateTextField("conditionsText", event.target.value)}
                  rows={4}
                  placeholder="One condition per line"
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span>Inventory</span>
                <textarea
                  disabled={!canEdit}
                  name="inventoryText"
                  value={formValues.inventoryText}
                  onChange={(event) => updateTextField("inventoryText", event.target.value)}
                  rows={6}
                  placeholder="One item per line"
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span>Notes</span>
                <textarea
                  disabled={!canEdit}
                  name="notes"
                  value={formValues.notes}
                  onChange={(event) => updateTextField("notes", event.target.value)}
                  rows={8}
                  placeholder="Backstory, tactics, reminders..."
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 disabled:opacity-80"
                />
              </label>
            </div>
          </article>
        </div>
      </section>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Saving..." : "Save character"}
          </button>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Changes stay local until you save.
          </p>
        </div>
      ) : null}
    </form>
  );
}
