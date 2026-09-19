import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "File or text",
    detail: "Upload a transaction history, or describe the payments in your own words.",
  },
  {
    title: "Sanitize",
    detail: "HTML, card numbers, and injection phrases come off before scoring.",
  },
  {
    title: "Policy pack",
    detail: "The history is matched against the live ruleset and workflow.",
  },
  {
    title: "Nemotron",
    detail: "A risk score and a written account of how that score was drawn.",
  },
  {
    title: "On this page",
    detail: "The conclusion comes back here — not a buried log.",
  },
  {
    title: "Developer training",
    detail: "An AI red team introduces new suspicious trends offline. Not a public page.",
  },
];

export function HomePage({
  stats,
}: {
  stats: { scanned: number; fraud: number; suspicious: number; clear: number };
}) {
  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:px-6 md:py-24">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
              NemoScantron
            </p>
            <h1 className="mt-3 font-heading text-4xl tracking-tight text-balance md:text-5xl">
              Score a transaction history before the next payment goes out.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Upload the file or type what happened. NemoScantron returns a risk
              score and the reasoning behind it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/scan" className={cn(buttonVariants({ size: "lg" }))}>
                Scan history
              </Link>
              <Link
                href="/how-it-works"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                How it works
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 self-start">
            <StatCard label="Histories scored" value={stats.scanned} />
            <StatCard label="Fraud" value={stats.fraud} tone="fraud" />
            <StatCard label="Suspicious" value={stats.suspicious} tone="suspicious" />
            <StatCard label="Clear" value={stats.clear} tone="clear" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          On the website
        </p>
        <h2 className="mt-2 font-heading text-2xl">History in, score and rationale out</h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border bg-card p-4">
              <p className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "fraud" | "suspicious" | "clear";
}) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-4">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          tone === "fraud"
            ? "font-heading text-3xl text-red-300"
            : tone === "suspicious"
              ? "font-heading text-3xl text-amber-200"
              : tone === "clear"
                ? "font-heading text-3xl text-emerald-300"
                : "font-heading text-3xl"
        }
      >
        {value}
      </p>
    </div>
  );
}
