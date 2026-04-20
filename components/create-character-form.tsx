"use client";

import { useActionState } from "react";

import {
  createCharacterAction,
} from "@/app/characters/actions";
import { INITIAL_CHARACTER_ACTION_STATE } from "@/app/characters/action-state";

export function CreateCharacterForm() {
  const [state, formAction, isPending] = useActionState(
    createCharacterAction,
    INITIAL_CHARACTER_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
    >
      <label className="grid gap-2 text-sm">
        <span>Name</span>
        <input
          required
          name="name"
          placeholder="Aela Stormborn"
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Class</span>
          <input
            required
            name="class"
            placeholder="Wizard"
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span>Level</span>
          <input
            required
            min={1}
            max={20}
            type="number"
            name="level"
            defaultValue={1}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2"
          />
        </label>
      </div>

      {state.status === "error" && state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Creating..." : "Create character"}
      </button>
    </form>
  );
}
