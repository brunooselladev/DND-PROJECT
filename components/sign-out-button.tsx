"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";

type SignOutButtonProps = {
  callbackUrl?: string;
  className?: string;
};

export function SignOutButton({ callbackUrl = "/spells", className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await signOut({ callbackUrl });
        });
      }}
      disabled={isPending}
      className={className}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
