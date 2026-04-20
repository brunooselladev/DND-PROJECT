"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type NavLinkProps = {
  href: string;
  label: string;
  icon?: string;
};

export function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx("nav-link", isActive && "nav-link-active")}
    >
      {icon ? <span className="text-base">{icon}</span> : null}
      {label}
    </Link>
  );
}
