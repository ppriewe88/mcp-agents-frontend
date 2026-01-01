"use client";

import Link from "next/link";

type NavButtonProps = {
  href: string;
  label: string;
};

export function NavButton({ href, label }: NavButtonProps) {
  return (
    <Link href={href} className="navButton">
      {label}
    </Link>
  );
}
