"use client";

import { useActionState, useDeferredValue, useState, useTransition } from "react";

import {
  applyDamageAction,
  healAction,
  longRestAction,
  recordDeathSaveAction,
  restoreSpellSlotAction,
  setSpellSlotMaxAction,
  shortRestAction,
  togglePreparedSpellAction,
  updateCharacterAction,
  consumeSpellSlotAction,
} from "@/app/characters/actions";
import { INITIAL_CHARACTER_ACTION_STATE } from "@/app/characters/action-state";
import { SPELL_SLOT_LEVELS, type SpellSlotLevelKey, type SpellSlotsState } from "@/lib/characters";

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
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  hitDiceTotal: number;
  hitDiceSpent: number;
  spellSlots: SpellSlotsState;
  preparedSpellIds: string[];
  conditionsText: string;
  inventoryText: string;
  notes: string;
  avatarUrl: string | null;
};

type CharacterSheetFormProps = {
  initialCharacter: CharacterSheetValue;
  spells: SpellOption[];
  canEdit: boolean;
  ownerName: string;
};

export function CharacterSheetForm({
  initialCharacter,
  spells,
  canEdit,
  ownerName,
}: CharacterSheetFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCharacterAction,
    INITIAL_CHARACTER_ACTION_STATE,
  );
  const [formValues, setFormValues] = useState(initialCharacter);
  const [isGameplayPending, startGameplayTransition] = useTransition();
  const [gameplayMessage, setGameplayMessage] = useState<string | null>(null);
  const [shortRestSpend, setShortRestSpend] = useState(1);
  const [spellSearch, setSpellSearch] = useState("");
  const deferredSpellSearch = useDeferredValue(spellSearch);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const defaultAvatar = formValues.class.toLowerCase().includes("rogue") || formValues.class.toLowerCase().includes("pícar")
    ? "/hero_rogue.png"
    : formValues.class.toLowerCase().includes("fighter") || formValues.class.toLowerCase().includes("guerr") || formValues.class.toLowerCase().includes("palad")
    ? "/hero_fighter.png"
    : "/hero_wizard.png";
    
  const displayAvatar = formValues.avatarUrl || defaultAvatar;

  const AVAILABLE_AVATARS = [
    { url: "/hero_wizard.png", label: "Wizard / Mage" },
    { url: "/hero_rogue.png", label: "Rogue / Thief" },
    { url: "/hero_fighter.png", label: "Fighter / Warrior" },
  ];

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
    const key = `level${level}` as SpellSlotLevelKey;

    setFormValues((current) => ({
      ...current,
      spellSlots: {
        ...current.spellSlots,
        [key]: {
          ...current.spellSlots[key],
          max: Number.isNaN(value) ? 0 : Math.max(0, value),
          used: Math.min(
            current.spellSlots[key].used,
            Number.isNaN(value) ? 0 : Math.max(0, value),
          ),
        },
      },
    }));
  }

  function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function applySnapshot(snapshot: {
    currentHp: number;
    maxHp: number;
    temporaryHp: number;
    deathSaveSuccesses: number;
    deathSaveFailures: number;
    hitDiceTotal: number;
    hitDiceSpent: number;
  }) {
    setFormValues((current) => ({
      ...current,
      currentHp: snapshot.currentHp,
      maxHp: snapshot.maxHp,
      temporaryHp: snapshot.temporaryHp,
      deathSaveSuccesses: snapshot.deathSaveSuccesses,
      deathSaveFailures: snapshot.deathSaveFailures,
      hitDiceTotal: snapshot.hitDiceTotal,
      hitDiceSpent: snapshot.hitDiceSpent,
    }));
  }

  function quickDamage(amount: number) {
    if (!canEdit) return;
    setGameplayMessage(null);

    setFormValues((current) => {
      const tempAbsorb = Math.min(current.temporaryHp, amount);
      const remaining = amount - tempAbsorb;
      const nextTemp = current.temporaryHp - tempAbsorb;
      const nextHp = clamp(current.currentHp - remaining, 0, current.maxHp);
      const droppedToZero = current.currentHp > 0 && nextHp === 0;
      return {
        ...current,
        temporaryHp: nextTemp,
        currentHp: nextHp,
        ...(droppedToZero ? { deathSaveSuccesses: 0, deathSaveFailures: 0 } : null),
      };
    });

    startGameplayTransition(() => {
      applyDamageAction(formValues.id, amount)
        .then((snapshot) => applySnapshot(snapshot))
        .catch((error) => setGameplayMessage(error instanceof Error ? error.message : "Damage failed."));
    });
  }

  function quickHeal(amount: number) {
    if (!canEdit) return;
    setGameplayMessage(null);
    setFormValues((current) => {
      const nextHp = clamp(current.currentHp + amount, 0, current.maxHp);
      return {
        ...current,
        currentHp: nextHp,
        ...(nextHp > 0 ? { deathSaveSuccesses: 0, deathSaveFailures: 0 } : null),
      };
    });

    startGameplayTransition(() => {
      healAction(formValues.id, amount)
        .then((snapshot) => applySnapshot(snapshot))
        .catch((error) => setGameplayMessage(error instanceof Error ? error.message : "Heal failed."));
    });
  }

  function fullHeal() {
    quickHeal(Math.max(0, formValues.maxHp - formValues.currentHp));
  }

  function setSpellSlotUsed(level: number, used: number) {
    const key = `level${level}` as SpellSlotLevelKey;
    setFormValues((current) => {
      const max = current.spellSlots[key]?.max ?? 0;
      const nextUsed = clamp(used, 0, max);
      return {
        ...current,
        spellSlots: {
          ...current.spellSlots,
          [key]: { ...current.spellSlots[key], used: nextUsed },
        },
      };
    });
  }

  function spendSpellSlot(level: number) {
    const key = `level${level}` as SpellSlotLevelKey;
    setFormValues((current) => {
      const band = current.spellSlots[key];
      const nextUsed = clamp(band.used + 1, 0, band.max);
      return {
        ...current,
        spellSlots: {
          ...current.spellSlots,
          [key]: { ...band, used: nextUsed },
        },
      };
    });

    if (!canEdit) return;
    setGameplayMessage(null);
    startGameplayTransition(() => {
      consumeSpellSlotAction(formValues.id, level)
        .then((slot) => {
          setFormValues((current) => ({
            ...current,
            spellSlots: {
              ...current.spellSlots,
              [key]: { ...current.spellSlots[key], max: slot.max, used: slot.used },
            },
          }));
        })
        .catch((error) =>
          setGameplayMessage(error instanceof Error ? error.message : "Use slot failed."),
        );
    });
  }

  function restoreSpellSlot(level: number) {
    const key = `level${level}` as SpellSlotLevelKey;
    setFormValues((current) => {
      const band = current.spellSlots[key];
      const nextUsed = clamp(band.used - 1, 0, band.max);
      return {
        ...current,
        spellSlots: {
          ...current.spellSlots,
          [key]: { ...band, used: nextUsed },
        },
      };
    });

    if (!canEdit) return;
    setGameplayMessage(null);
    startGameplayTransition(() => {
      restoreSpellSlotAction(formValues.id, level)
        .then((slot) => {
          setFormValues((current) => ({
            ...current,
            spellSlots: {
              ...current.spellSlots,
              [key]: { ...current.spellSlots[key], max: slot.max, used: slot.used },
            },
          }));
        })
        .catch((error) =>
          setGameplayMessage(error instanceof Error ? error.message : "Restore slot failed."),
        );
    });
  }

  function longRest() {
    setFormValues((current) => {
      const resetSlots = Object.fromEntries(
        Object.entries(current.spellSlots).map(([key, band]) => [
          key,
          { ...band, used: 0 },
        ]),
      ) as SpellSlotsState;

      return {
        ...current,
        currentHp: current.maxHp,
        spellSlots: resetSlots,
        conditionsText: "",
        temporaryHp: 0,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
      };
    });

    if (!canEdit) return;
    setGameplayMessage(null);
    startGameplayTransition(() => {
      longRestAction(formValues.id)
        .then((result) => {
          if (!result.ok) {
            setGameplayMessage(result.message);
            return;
          }
          applySnapshot(result.snapshot);
        })
        .catch((error) =>
          setGameplayMessage(error instanceof Error ? error.message : "Long rest failed."),
        );
    });
  }

  function togglePreparedSpell(spellId: string, checked: boolean) {
    setFormValues((current) => {
      const nextPrepared = checked
        ? Array.from(new Set([...current.preparedSpellIds, spellId]))
        : current.preparedSpellIds.filter((id) => id !== spellId);
      return { ...current, preparedSpellIds: nextPrepared };
    });

    if (!canEdit) return;
    setGameplayMessage(null);
    startGameplayTransition(() => {
      togglePreparedSpellAction(formValues.id, spellId, checked)
        .then((preparedIds) => {
          setFormValues((current) => ({ ...current, preparedSpellIds: preparedIds }));
        })
        .catch((error) =>
          setGameplayMessage(error instanceof Error ? error.message : "Update prepared spells failed."),
        );
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="characterId" value={formValues.id} />
      <input type="hidden" name="avatarUrl" value={formValues.avatarUrl || ""} />
      {formValues.preparedSpellIds.map((spellId) => (
        <input key={spellId} type="hidden" name="preparedSpellIds" value={spellId} />
      ))}

      {!canEdit ? (
        <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--muted-foreground)]">
          This sheet is view-only because only the character owner can edit it.
        </div>
      ) : null}

      <header className="relative overflow-hidden rounded-md border-2 border-[color:var(--border)] bg-[color:var(--background)] shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--background)] via-[color:var(--background)] to-transparent z-10 md:w-2/3" />
        <div className="absolute inset-0 z-0 flex justify-end">
          <img src={displayAvatar} alt="Character art" className="h-full w-full object-cover md:w-1/2 object-top opacity-60 transition-all duration-500" />
        </div>
        
        <div className="relative z-20 p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[color:var(--foreground)] drop-shadow-sm">{formValues.name}</h1>
            <p className="mt-2 text-lg font-display text-[color:var(--muted-foreground)]">
              Level {formValues.level} {formValues.class}
              {formValues.race ? ` · ${formValues.race}` : ""}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] font-semibold text-[color:var(--accent-strong)]">
              Owner: {ownerName}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 relative">
            <span className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs uppercase font-bold text-[color:var(--muted-foreground)] shadow-sm">
              {canEdit ? "Editable" : "View only"}
            </span>
            {canEdit ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsImageSelectorOpen(!isImageSelectorOpen)}
                  className="btn-ghost bg-[color:var(--background)] bg-opacity-80 backdrop-blur-sm text-xs px-2 py-1"
                >
                  Change Portrait
                </button>
                {isImageSelectorOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl z-50 p-2 grid gap-1">
                    {AVAILABLE_AVATARS.map((avatar) => (
                      <button
                        key={avatar.url}
                        type="button"
                        onClick={() => {
                          setFormValues(curr => ({ ...curr, avatarUrl: avatar.url }));
                          setIsImageSelectorOpen(false);
                        }}
                        className={`flex items-center gap-2 p-2 rounded hover:bg-[color:var(--surface-soft)] transition-colors text-left text-xs ${displayAvatar === avatar.url ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-glow)]' : 'text-[color:var(--muted-foreground)]'}`}
                      >
                        <img src={avatar.url} alt="" className="w-8 h-8 rounded object-cover border border-[color:var(--border)]" />
                        {avatar.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

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

      <section className="grid gap-4 panel-ornate md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="panel-ornate-header">Basics</h2>
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
          <article className="panel-ornate">
            <h2 className="panel-ornate-header">Stats</h2>
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

          <article className="panel-ornate">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="panel-ornate-header !mb-0 !border-none">Spells</h2>
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

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {SPELL_SLOT_LEVELS.map((level) => {
                const key = `level${level}` as SpellSlotLevelKey;
                const band = formValues.spellSlots[key] ?? { max: 0, used: 0 };
                const remaining = Math.max(0, band.max - band.used);
                const pipTotal = Math.min(10, band.max);
                const pipUsed = Math.min(10, band.used);
                const isEmpty = band.max === 0;

                return (
                  <div
                    key={key}
                    className="card p-4 text-sm flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-xs font-semibold text-[color:var(--foreground)]">
                          {level}
                        </span>
                        <div className="leading-tight">
                          <div className="text-sm font-semibold text-[color:var(--foreground)]">Spell slots</div>
                          <div className="text-[11px] text-[color:var(--muted-foreground)]">Level {level}</div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 tabular-nums">
                        <span className="text-lg font-semibold text-[color:var(--foreground)]">{remaining}</span>
                        <span className="text-xs font-medium text-[color:var(--muted-foreground)]">/</span>
                        <span className="text-xs font-medium text-[color:var(--muted-foreground)]">{band.max}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      {isEmpty ? (
                        <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[11px] text-[color:var(--muted-foreground)]">
                          Set max to track slots for this level.
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: pipTotal }).map((_, index) => {
                              const filled = index < pipUsed;
                              return (
                                <span
                                  key={index}
                                  className={
                                    "h-2.5 w-2.5 rounded-full ring-1 ring-inset transition " +
                                    (filled
                                      ? "bg-[color:var(--accent-strong)] ring-[color:var(--accent-strong)]"
                                      : "bg-[color:var(--surface)] ring-[color:var(--border)]")
                                  }
                                />
                              );
                            })}
                            {band.max > pipTotal ? (
                              <span className="ml-1 text-[11px] text-[color:var(--muted-foreground)]">
                                +{band.max - pipTotal}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-[color:var(--muted-foreground)]">
                            Used {band.used}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-2">
                      <div className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] pt-3">
                        <label className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                            Max
                          </span>
                          <input
                            disabled={!canEdit}
                            min={0}
                            max={99}
                            type="number"
                            name={`${key}Max`}
                            value={band.max}
                            onChange={(event) => updateSpellSlot(level, Number(event.target.value))}
                            onBlur={() => {
                              if (!canEdit) return;
                              setGameplayMessage(null);
                              startGameplayTransition(() => {
                                setSpellSlotMaxAction(formValues.id, level, band.max)
                                  .then((slot) => {
                                    setFormValues((current) => ({
                                      ...current,
                                      spellSlots: {
                                        ...current.spellSlots,
                                        [key]: { ...current.spellSlots[key], max: slot.max, used: slot.used },
                                      },
                                    }));
                                  })
                                  .catch((error) =>
                                    setGameplayMessage(
                                      error instanceof Error ? error.message : "Update slot max failed.",
                                    ),
                                  );
                              });
                            }}
                            className="input h-8 w-16 text-center disabled:opacity-80"
                          />
                        </label>
                        <div className="text-[10px] text-[color:var(--muted-foreground)] uppercase tracking-wider text-right">
                          {canEdit ? "Tap Use to cast" : ""}
                        </div>
                      </div>

                      <input type="hidden" name={`${key}Used`} value={band.used} />

                      {canEdit ? (
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => spendSpellSlot(level)}
                            disabled={band.used >= band.max}
                            className="btn-primary flex-1 h-9 shadow-none text-xs"
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            onClick={() => restoreSpellSlot(level)}
                            disabled={band.used <= 0}
                            className="btn-ghost flex-1 h-9 text-xs"
                          >
                            Restore
                          </button>
                        </div>
                      ) : null}

                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => setSpellSlotUsed(level, 0)}
                          disabled={band.used === 0}
                          className="h-8 rounded-sm border border-[color:var(--border)] bg-transparent px-3 py-1 text-[10px] uppercase tracking-wide font-medium text-[color:var(--muted-foreground)] transition hover:bg-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reset used
                        </button>
                      ) : null}
                    </div>
                  </div>
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
          <article className="panel-ornate">
            <h2 className="panel-ornate-header">Combat</h2>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
              <div
                className="h-full rounded-full bg-[color:var(--accent-strong)] transition-all"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              {formValues.currentHp} / {formValues.maxHp} HP with {formValues.temporaryHp} temporary HP.
            </p>

            {gameplayMessage ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {gameplayMessage}
              </p>
            ) : null}

            {isGameplayPending ? (
              <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">Updating...</p>
            ) : null}

            {formValues.currentHp === 0 ? (
              <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--foreground)]">Death saves</p>
                    <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                      Successes {formValues.deathSaveSuccesses}/3 · Failures {formValues.deathSaveFailures}/3
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGameplayMessage(null);
                          setFormValues((current) => ({
                            ...current,
                            deathSaveSuccesses: clamp(current.deathSaveSuccesses + 1, 0, 3),
                          }));
                          startGameplayTransition(() => {
                            recordDeathSaveAction(formValues.id, "success")
                              .then((snapshot) => applySnapshot(snapshot))
                              .catch((error) =>
                                setGameplayMessage(
                                  error instanceof Error ? error.message : "Death save failed.",
                                ),
                              );
                          });
                        }}
                        disabled={formValues.deathSaveSuccesses >= 3 || formValues.deathSaveFailures >= 3}
                        className="rounded-md bg-[color:var(--accent-strong)] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Success
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGameplayMessage(null);
                          setFormValues((current) => ({
                            ...current,
                            deathSaveFailures: clamp(current.deathSaveFailures + 1, 0, 3),
                          }));
                          startGameplayTransition(() => {
                            recordDeathSaveAction(formValues.id, "failure")
                              .then((snapshot) => applySnapshot(snapshot))
                              .catch((error) =>
                                setGameplayMessage(
                                  error instanceof Error ? error.message : "Death save failed.",
                                ),
                              );
                          });
                        }}
                        disabled={formValues.deathSaveSuccesses >= 3 || formValues.deathSaveFailures >= 3}
                        className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Failure
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {canEdit ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => quickDamage(5)}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-medium"
                >
                  -5 HP
                </button>
                <button
                  type="button"
                  onClick={() => quickDamage(10)}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-medium"
                >
                  -10 HP
                </button>
                <button
                  type="button"
                  onClick={() => quickHeal(5)}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-medium"
                >
                  +5 HP
                </button>
                <button
                  type="button"
                  onClick={fullHeal}
                  className="rounded-md bg-[color:var(--accent-strong)] px-3 py-2 text-sm font-medium text-white"
                >
                  Full heal
                </button>
              </div>
            ) : null}

            {canEdit ? (
              <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                <p className="text-sm font-medium text-[color:var(--foreground)]">Rest</p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                  Hit Dice: {Math.max(0, formValues.hitDiceTotal - formValues.hitDiceSpent)}/{formValues.hitDiceTotal} available
                </p>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="grid gap-1 text-xs">
                    <span className="text-[color:var(--muted-foreground)]">Short rest (spend HD)</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={shortRestSpend}
                      onChange={(event) => setShortRestSpend(Number(event.target.value))}
                      className="w-28 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setGameplayMessage(null);
                      startGameplayTransition(() => {
                        shortRestAction(formValues.id, shortRestSpend)
                          .then((snapshot) => applySnapshot(snapshot))
                          .catch((error) =>
                            setGameplayMessage(error instanceof Error ? error.message : "Short rest failed."),
                          );
                      });
                    }}
                    className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium"
                  >
                    Short rest
                  </button>
                </div>
              </div>
            ) : null}

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

            {canEdit ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={longRest}
                  className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium"
                >
                  Long rest (heal, reset slots, clear conditions)
                </button>
              </div>
            ) : null}
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
