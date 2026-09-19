import Image from "next/image";
import { PipelineMap } from "@/components/console/pipeline-map";
import { TeamBoard } from "@/components/console/team-board";

export function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="max-w-2xl">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          How it works
        </p>
        <h1 className="mt-2 font-heading text-3xl tracking-tight md:text-4xl">
          History in. Score and rationale out.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          The website takes a transaction file or a written description.
          Nemotron draws a risk score and explains it. Red-team trend training
          is a developer command, not a page here.
        </p>
      </div>

      <div className="mt-10">
        <PipelineMap run={null} />
      </div>

      <figure className="mt-10 overflow-hidden rounded-2xl border bg-card p-3">
        <Image
          src="/workflow.png"
          alt="NemoScantron workflow: website intake and developer red-team training feed a shared ruleset."
          width={1119}
          height={544}
          className="mx-auto h-auto w-full bg-white"
        />
        <figcaption className="mt-2 text-xs text-muted-foreground">
          The gray box is this website. The red box is AI trend training for
          developers (<code>npm run train-trends</code>), not a public lab.
        </figcaption>
      </figure>

      <div className="mt-12">
        <TeamBoard />
      </div>
    </div>
  );
}
