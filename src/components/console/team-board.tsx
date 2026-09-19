"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LANES = [
  {
    person: "Person A",
    role: "Intake",
    owns: "Website, files/prompts, sanitizer, metrics on the way back out.",
    files: [
      "src/components/console/scan-panel.tsx",
      "src/lib/pipeline/sanitize.ts",
      "src/app/api/scan/route.ts",
    ],
    color: "border-zinc-400/50",
  },
  {
    person: "Person B",
    role: "Policy",
    owns: "Ruleset, policies, workflow description, Nemotron reasoning, feedback trainer.",
    files: [
      "src/lib/data/default-rules.ts",
      "src/lib/pipeline/ruleset.ts",
      "src/lib/pipeline/reasoning.ts",
      "src/lib/pipeline/feedback.ts",
      "src/components/console/rules-panel.tsx",
      "src/components/console/feedback-panel.tsx",
    ],
    color: "border-sky-400/50",
  },
  {
    person: "Person C",
    role: "Execution",
    owns: "Red-team fixtures, Nemo dispatcher, execution output, replaying misses.",
    files: [
      "src/lib/data/red-team-events.ts",
      "src/lib/pipeline/red-team.ts",
      "src/lib/pipeline/execute.ts",
      "src/app/api/red-team/route.ts",
      "src/components/console/red-team-panel.tsx",
    ],
    color: "border-emerald-400/50",
  },
];

export function TeamBoard() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-base">Three-person split</h3>
        <p className="text-sm text-muted-foreground">
          The diagram already has three swimlanes. Keep contracts at the JSON types in{" "}
          <code>src/lib/pipeline/types.ts</code> and nobody has to wait on a rewrite.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {LANES.map((lane) => (
          <Card key={lane.person} className={lane.color}>
            <CardHeader>
              <Badge variant="outline">{lane.person}</Badge>
              <CardTitle>{lane.role}</CardTitle>
              <CardDescription>{lane.owns}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
                {lane.files.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
