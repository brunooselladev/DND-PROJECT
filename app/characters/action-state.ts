export type CharacterActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_CHARACTER_ACTION_STATE: CharacterActionState = {
  status: "idle",
};

