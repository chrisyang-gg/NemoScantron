"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FeedbackProposal } from "@/lib/pipeline/types";

export function FeedbackPanel({
  proposals,
  engineLabel,
  busy,
  onDecide,
}: {
  proposals: FeedbackProposal[];
  engineLabel: string;
  busy: boolean;
  onDecide: (id: string, status: "accepted" | "rejected") => void;
}) {
  const pending = proposals.filter((p) => p.status === "pending");
  const done = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-base">AI feedback loop</h3>
        <p className="text-sm text-muted-foreground">
          Person B reviews these. When the AI red team labels a case differently than
          Nemotron, this agent writes the miss rationale and a proposed rule. Same
          Nemotron contract as the adversary.
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{engineLabel}</p>
      </div>

      {pending.length === 0 ? (
        <Alert>
          <AlertTitle>No pending proposals</AlertTitle>
          <AlertDescription>
            Generate an “Evade the current pack” attack on the Red team tab. If the
            bench misses it, the feedback agent will land a proposal here.
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-3">
          {pending.map((proposal) => (
            <li
              key={proposal.id}
              className="space-y-3 rounded-xl border border-violet-400/40 bg-violet-500/10 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{proposal.missKind}</Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {proposal.engine}
                </span>
              </div>
              {proposal.steps.length ? (
                <ol className="space-y-1.5">
                  {proposal.steps.map((step, index) => (
                    <li key={step.title} className="text-sm">
                      <span className="font-mono text-muted-foreground">{index + 1}.</span>{" "}
                      <span className="font-medium">{step.title}.</span> {step.detail}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm">{proposal.reason}</p>
              )}
              <div className="rounded-lg bg-background/60 p-2">
                <p className="font-medium">{proposal.proposedRule.title}</p>
                <p className="text-sm text-muted-foreground">
                  {proposal.proposedRule.policy}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {proposal.proposedRule.signals.join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => onDecide(proposal.id, "accepted")}
                >
                  Accept into ruleset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onDecide(proposal.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {done.length ? (
        <div className="space-y-2">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Already decided
          </p>
          <ul className="space-y-2">
            {done.map((proposal) => (
              <li
                key={proposal.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>{proposal.proposedRule.title}</span>
                <Badge variant="secondary">{proposal.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
