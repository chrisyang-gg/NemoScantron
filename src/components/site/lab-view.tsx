"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RedTeamPanel } from "@/components/console/red-team-panel";
import { RulesPanel } from "@/components/console/rules-panel";
import { FeedbackPanel } from "@/components/console/feedback-panel";
import { ResultRail } from "@/components/site/result-rail";
import { useBench, type BenchState } from "@/hooks/use-bench";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

export function LabView({ initial }: { initial: BenchState }) {
  const bench = useBench(initial);
  const [tab, setTab] = useState("red-team");
  const labRuns = bench.state.runs.filter((run) => run.input.source === "red-team");
  const run =
    bench.activeRun?.input.source === "red-team"
      ? bench.activeRun
      : (labRuns[0] ?? null);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Lab
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight md:text-4xl">
            AI red team
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            The adversary writes fake fraud against the live pack and sends it
            through the same pipe as the public scan page. Misses land on Feedback
            as a proposed rule.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg border px-2.5 py-1.5 font-mono">
            {bench.state.ai.live ? "NVIDIA" : "local"} · {bench.state.ai.label}
          </span>
          <Button variant="ghost" size="sm" onClick={bench.reset} disabled={bench.busy}>
            <RotateCcw />
            Reset lab
          </Button>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (typeof value === "string") setTab(value);
          }}
        >
          <TabsList variant="line" className="flex-wrap justify-start">
            <TabsTrigger value="red-team">Red team</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          <TabsContent value="red-team" className="pt-4">
            <RedTeamPanel
              families={bench.state.attackFamilies}
              attacks={bench.state.generatedAttacks}
              engineLabel={bench.state.ai.label}
              live={bench.state.ai.live}
              busy={bench.busy}
              error={bench.error}
              onGenerate={bench.generate}
              onReplay={bench.replay}
            />
          </TabsContent>
          <TabsContent value="feedback" className="pt-4">
            <FeedbackPanel
              proposals={bench.state.proposals}
              engineLabel={bench.state.ai.label}
              busy={bench.busy}
              onDecide={bench.decide}
            />
          </TabsContent>
          <TabsContent value="rules" className="pt-4">
            <RulesPanel rules={bench.state.rules} />
          </TabsContent>
        </Tabs>

        <ResultRail
          run={run}
          runs={labRuns}
          onSelect={bench.setActiveRun}
          emptyHint="Generate an attack to see the website metric this case would have produced."
        />
      </div>
    </div>
  );
}
