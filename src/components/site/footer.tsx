export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-heading">NemoScantron</p>
        <p className="text-sm text-muted-foreground">
          Developers train new suspicious trends with{" "}
          <code>npm run train-trends</code>.
        </p>
      </div>
    </footer>
  );
}
