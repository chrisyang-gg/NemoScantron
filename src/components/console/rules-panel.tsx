"use client";

import { Badge } from "@/components/ui/badge";
import type { Rule } from "@/lib/pipeline/types";

const LANE: Record<Rule["owner"], string> = {
  intake: "A · Intake",
  policy: "B · Policy",
  execution: "C · Execution",
};

export function RulesPanel({ rules }: { rules: Rule[] }) {
  if (!rules.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No rules loaded. Check <code>src/lib/data/default-rules.ts</code>.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-base">Ruleset, policies, workflow</h3>
        <p className="text-sm text-muted-foreground">
          Person B owns this pack. Each rule is a policy sentence plus the signals
          Nemotron is allowed to treat as evidence. Accepting feedback writes a new
          row here.
        </p>
      </div>
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{rule.title}</p>
              <Badge variant={rule.enabled ? "default" : "secondary"}>
                {rule.enabled ? "on" : "off"}
              </Badge>
              <Badge variant="outline">{rule.severity}</Badge>
              <Badge variant="ghost">{LANE[rule.owner]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{rule.policy}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              needs {rule.minHits}+ of: {rule.signals.join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
