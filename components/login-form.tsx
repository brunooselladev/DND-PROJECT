"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const ROLE_OPTIONS = [
  { value: "PLAYER", label: "Player" },
  { value: "DM", label: "DM" },
  { value: "ADMIN", label: "Admin" },
] as const;

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access was denied. Try another sign-in method.",
  CredentialsSignin: "Unable to sign in with those development credentials.",
  OAuthAccountNotLinked: "That email is already linked to a different sign-in method.",
};

type LoginFormProps = {
  allowDevCredentials: boolean;
  githubConfigured: boolean;
};

export function LoginForm({ allowDevCredentials, githubConfigured }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/spells";
  const errorCode = searchParams.get("error");

  const [email, setEmail] = useState("gm@table.party");
  const [name, setName] = useState("Dungeon Master");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("PLAYER");
  const [errorMessage, setErrorMessage] = useState<string | null>(errorCode ? ERROR_MESSAGES[errorCode] ?? "Unable to sign in." : null);
  const [isPending, startTransition] = useTransition();

  function handleDevSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await signIn("dev-email", {
        email,
        name,
        role,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(ERROR_MESSAGES[result.error] ?? "Unable to sign in.");
        return;
      }

      window.location.href = result?.url ?? callbackUrl;
    });
  }

  function handleGithubSignIn() {
    setErrorMessage(null);
    void signIn("github", { callbackUrl });
  }

  if (!allowDevCredentials && !githubConfigured) {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-sm text-[color:var(--muted-foreground)]">
        Authentication is currently unavailable because no providers are configured.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allowDevCredentials ? (
        <form
          onSubmit={handleDevSignIn}
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
        >
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Development Login</h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Use any email and choose a role for local testing.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>Display Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2"
              />
            </label>

            <label className="grid gap-2 text-sm md:col-span-2">
              <span>Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as (typeof ROLE_OPTIONS)[number]["value"])}
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Signing in..." : "Sign in with development credentials"}
          </button>
        </form>
      ) : null}

      {githubConfigured ? (
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">GitHub</h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Continue with GitHub if OAuth is configured for this environment.
          </p>

          <button
            type="button"
            onClick={handleGithubSignIn}
            className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--surface-strong)]"
          >
            Continue with GitHub
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </div>
  );
}
