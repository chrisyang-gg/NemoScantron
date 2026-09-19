"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Bot, RotateCcw } from "lucide-react";
import type { GeneratedAttack, Verdict } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export type AttackFamilyCard = {
  id: string;
  name: string;
  expectedVerdict: Verdict;
  goal: string;
};

export function RedTeamPanel({
  families,
  attacks,
  engineLabel,
  live,
  busy,
  error,
  onGenerate,
  onReplay,
}: {
  families: AttackFamilyCard[];
  attacks: GeneratedAttack[];
  engineLabel: string;
  live: boolean;
  busy: boolean;
  error: string | null;
  onGenerate: (payload: { family: string; brief: string }) => void;
  onReplay: (id: string) => void;
}) {
  const [family, setFamily] = useState(families[0]?.id ?? "evade");
  const [brief, setBrief] = useState("");
  const latest = attacks[0] ?? null;
  const selected = families.find((item) => item.id === family) ?? families[0];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-base">AI red team</h3>
        <p className="text-sm text-muted-foreground">
          Person C owns this agent. It reads the live ruleset and writes a synthetic
          case, then dispatches it through the same pipe as the website. Set{" "}
          <code>NVIDIA_API_KEY</code> to run it on Nemotron; otherwise it uses the
          local Nemotron-compatible adversary.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={live ? "default" : "outline"}>{engineLabel}</Badge>
        <span className="text-muted-foreground">
          {live ? "Live NVIDIA Nemotron" : "Local agent — same JSON contract as Nemotron"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {families.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={family === item.id ? "default" : "outline"}
            disabled={busy}
            onClick={() => setFamily(item.id)}
            className={cn(item.expectedVerdict === "fraud" && family !== item.id && "border-red-500/40")}
          >
            {item.name}
          </Button>
        ))}
      </div>

      {selected ? (
        <p className="text-sm text-muted-foreground">{selected.goal}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="brief">Optional operator brief</Label>
        <Textarea
          id="brief"
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Target AP for a construction vendor. Do not use the word wire."
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Red team failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy || !family}
          onClick={() => onGenerate({ family, brief })}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Bot />}
          Generate and dispatch
        </Button>
        <Button
          variant="outline"
          disabled={busy || !latest}
          onClick={() => latest && onReplay(latest.id)}
        >
          <RotateCcw />
          Replay last attack
        </Button>
      </div>

      {latest ? (
        <article className="space-y-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{latest.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {latest.filename} · {latest.engine}
              </p>
            </div>
            <Badge variant="outline">expect {latest.expectedVerdict}</Badge>
          </div>
          <p className="text-sm">{latest.attackPlan}</p>
          {latest.evadeNotes.length ? (
            <p className="text-xs text-muted-foreground">
              {latest.evadeNotes.join(" · ")}
            </p>
          ) : null}
          <pre className="max-h-48 overflow-auto rounded-lg bg-background/70 p-2 font-mono text-[11px] whitespace-pre-wrap">
            {latest.body}
          </pre>
        </article>
      ) : (
        <Alert>
          <AlertTitle>No attack generated yet</AlertTitle>
          <AlertDescription>
            Start with “Evade the current pack”. A miss opens an AI feedback proposal
            on the Feedback tab. Accept it, then replay — the same payload should now
            score as fraud.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
