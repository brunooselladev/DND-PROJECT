import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { SignOutButton } from "@/components/sign-out-button";
import { allowDevCredentials, getCurrentUser, githubConfigured, isAdminRole } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LoginPage({ searchParams }: PageProps) {
  const [currentUser, params] = await Promise.all([getCurrentUser(), searchParams]);
  const callbackUrl = getParam(params, "callbackUrl") || "/spells";

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="font-display text-3xl text-[color:var(--foreground)]">Login</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Authentication is optional for the compendium, but required for admin access.
        </p>
      </header>

      {currentUser ? (
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <p className="text-sm text-[color:var(--foreground)]">
            Signed in as <span className="font-medium">{currentUser.name ?? currentUser.email}</span>.
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
            Role: {currentUser.role}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={callbackUrl}
              className="rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white"
            >
              Continue
            </Link>
            {isAdminRole(currentUser.role) ? (
              <Link
                href="/admin"
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium"
              >
                Open admin
              </Link>
            ) : null}
            <SignOutButton className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium" />
          </div>
        </div>
      ) : (
        <LoginForm allowDevCredentials={allowDevCredentials} githubConfigured={githubConfigured} />
      )}
    </section>
  );
}
