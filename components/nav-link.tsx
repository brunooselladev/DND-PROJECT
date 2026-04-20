"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label, icon }: { href: string; label: string; icon?: string }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`nav-link ${isActive ? "nav-link-active" : ""}`}
    >
      {icon ? <span className="opacity-80 text-lg w-6 text-center">{icon}</span> : null}
      {label}
    </Link>
  );
}
