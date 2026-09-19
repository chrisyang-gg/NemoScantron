"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LANES = [
  {
    person: "Person A",
    role: "Website",
    owns: "Public site: transaction file or text in, risk score and rationale out.",
    files: [
      "src/components/site/",
      "src/components/console/scan-panel.tsx",
      "src/lib/pipeline/sanitize.ts",
    ],
    color: "border-zinc-400/50",
  },
  {
    person: "Person B",
    role: "Policy",
    owns: "Ruleset, Nemotron scoring, and the AI feedback agent used during trend training.",
    files: [
      "src/lib/data/default-rules.ts",
      "src/lib/pipeline/reasoning.ts",
      "src/lib/ai/feedback-agent.ts",
    ],
    color: "border-sky-400/50",
  },
  {
    person: "Person C",
    role: "Training",
    owns: "AI red team that introduces new suspicious trends for developers. Not a website page.",
    files: [
      "src/lib/ai/red-team-agent.ts",
      "src/app/api/train/route.ts",
      "scripts/train-trends.mjs",
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
          Only intake is on the public website. Red-team trend training is a
          developer command that writes into the same ruleset the site uses.
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
