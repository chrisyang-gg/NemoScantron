import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-heading">NemoScantron</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Score a transaction history. See the risk number and how it was drawn.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            On this site
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/scan" className="hover:underline">
                Scan history
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:underline">
                How it works
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="text-xs tracking-wide uppercase">Developers</p>
          <p className="mt-2">
            New suspicious trends are trained offline with{" "}
            <code>npm run train-trends</code>. That is not a page on this website.
          </p>
        </div>
      </div>
    </footer>
  );
}
