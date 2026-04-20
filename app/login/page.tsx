import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { SignOutButton } from "@/components/sign-out-button";
import { allowDevCredentials, getCurrentUser, githubConfigured, isAdminRole } from "@/lib/auth";
import { getParam } from "@/lib/params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
        <div className="card-static p-5">
          <p className="text-sm text-[color:var(--foreground)]">
            Signed in as <span className="font-medium text-[color:var(--accent-glow)]">{currentUser.name ?? currentUser.email}</span>.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
            Role: <span className="badge badge-accent">{currentUser.role}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={callbackUrl}
              className="btn-primary"
            >
              Continue
            </Link>
            {isAdminRole(currentUser.role) ? (
              <Link
                href="/admin"
                className="btn-ghost"
              >
                Open admin
              </Link>
            ) : null}
            <SignOutButton className="btn-ghost" />
          </div>
        </div>
      ) : (
        <LoginForm allowDevCredentials={allowDevCredentials} githubConfigured={githubConfigured} />
      )}
    </section>
  );
}
