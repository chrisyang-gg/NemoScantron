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
          Website in, metric out.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          The public scan page and the lab adversary share one pipe. Nemotron
          reasons. Nemo dispatches. The score comes back onto the site.
        </p>
      </div>

      <div className="mt-10">
        <PipelineMap run={null} />
      </div>

      <figure className="mt-10 overflow-hidden rounded-2xl border bg-card p-3">
        <Image
          src="/workflow.png"
          alt="NemoScantron workflow: website and red team feed a shared ruleset, Nemotron reasons, Nemo executes, feedback trains the rules."
          width={1119}
          height={544}
          className="mx-auto h-auto w-full bg-white"
        />
        <figcaption className="mt-2 text-xs text-muted-foreground">
          Original sketch. The gray box is this website. The purple box is the AI
          feedback loop on /lab.
        </figcaption>
      </figure>

      <div className="mt-12">
        <TeamBoard />
      </div>
    </div>
  );
}
