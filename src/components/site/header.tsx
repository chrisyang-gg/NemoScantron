"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 md:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-base tracking-tight">NemoScantron</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            risk score
          </span>
        </Link>
      </div>
    </header>
  );
}
