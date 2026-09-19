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
    owns: "Ruleset, Nemotron scoring, and the AI feedback agent that trains rules from misses.",
    files: [
      "src/lib/data/default-rules.ts",
      "src/lib/pipeline/reasoning.ts",
      "src/lib/ai/feedback-agent.ts",
      "src/components/console/feedback-panel.tsx",
    ],
    color: "border-sky-400/50",
  },
  {
    person: "Person C",
    role: "Execution",
    owns: "AI red team that writes fake fraud, Nemo dispatcher, execution output.",
    files: [
      "src/lib/ai/red-team-agent.ts",
      "src/lib/data/attack-families.ts",
      "src/lib/pipeline/execute.ts",
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
          Both adversary and trainer are agents behind the same Nemotron JSON contract
          in <code>src/lib/ai/engine.ts</code>. Types stay in{" "}
          <code>src/lib/pipeline/types.ts</code>.
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
