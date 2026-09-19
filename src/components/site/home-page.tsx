import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "This website",
    detail: "You drop a file and a question. That is the only intake the model sees.",
  },
  {
    title: "Sanitize",
    detail: "HTML, PAN, and injection phrases come off before policy runs.",
  },
  {
    title: "Policy pack",
    detail: "Rules, policies, and the Nemo dispatch workflow sit in one place.",
  },
  {
    title: "Nemotron",
    detail: "A verdict, a risk score, and a short description — the site metric.",
  },
  {
    title: "Nemo",
    detail: "Hold funds, page an analyst, or close the case.",
  },
  {
    title: "AI loop",
    detail: "The red-team agent writes fake fraud. The feedback agent trains the pack.",
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
              Read the payment file on the website, before money moves.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Submit an email, invoice, or payroll dump. We sanitize it, score it
              against policy, let Nemotron reason, and Nemo writes a risk score and a
              short description back onto this site.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/scan" className={cn(buttonVariants({ size: "lg" }))}>
                Submit a file
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
            <StatCard label="Files scanned" value={stats.scanned} />
            <StatCard label="Fraud" value={stats.fraud} tone="fraud" />
            <StatCard label="Suspicious" value={stats.suspicious} tone="suspicious" />
            <StatCard label="Clear" value={stats.clear} tone="clear" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          What the site does
        </p>
        <h2 className="mt-2 font-heading text-2xl">From the form to the metric</h2>
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

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:px-6">
          <div>
            <Badge variant="outline">Website intake</Badge>
            <h2 className="mt-3 font-heading text-2xl">
              Files and a prompt. That is the product.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Accounts payable drops a vendor email. You ask whether to pay. The
              page comes back with a verdict, a risk score, and the Nemo action —
              hold, notify, or close — not a buried log file.
            </p>
            <Link href="/scan" className={cn(buttonVariants(), "mt-4 inline-flex")}>
              Open the scan page
            </Link>
          </div>
          <div>
            <Badge variant="outline">Lab</Badge>
            <h2 className="mt-3 font-heading text-2xl">
              An AI red team lives on the same site.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The lab agent reads the live ruleset and writes fake fraud. When
              Nemotron misses, the feedback agent proposes a rule. Accept it, replay
              the attack, and the website metric should flip to fraud.
            </p>
            <Link href="/lab" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
              Open the lab
            </Link>
          </div>
        </div>
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
