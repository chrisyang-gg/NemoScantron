import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-heading">NemoScantron</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A website for payment files. Sanitize, reason with Nemotron, dispatch
            with Nemo, and write the metric back onto the page.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            On this site
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/scan" className="hover:underline">
                Scan a file
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:underline">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/lab" className="hover:underline">
                Red-team lab
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="text-xs tracking-wide uppercase">Team</p>
          <p className="mt-2">
            Intake owns this website. Policy owns Nemotron and the AI feedback
            loop. Execution owns the AI red team and Nemo dispatch.
          </p>
        </div>
      </div>
    </footer>
  );
}
