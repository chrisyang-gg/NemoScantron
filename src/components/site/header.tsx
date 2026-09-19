"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-40">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-[0.22em] text-violet-100 uppercase">
            NemoScantron
          </span>
        </Link>
        <span className="text-[10px] tracking-[0.28em] text-violet-300/50 uppercase">
          Nemotron fraud watch
        </span>
      </div>
    </header>
  );
}
