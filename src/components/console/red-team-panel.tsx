"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert } from "lucide-react";
import type { Verdict } from "@/lib/pipeline/types";

export type RedTeamCard = {
  id: string;
  name: string;
  expectedVerdict: Verdict;
  filename: string;
  notes: string;
};

export function RedTeamPanel({
  events,
  busy,
  error,
  onInject,
}: {
  events: RedTeamCard[];
  busy: boolean;
  error: string | null;
  onInject: (eventId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-base">Red team fixtures</h3>
        <p className="text-sm text-muted-foreground">
          Person C owns this box. Inject a fake fraud event into the same pipeline the
          website uses. The lookalike-vendor case is supposed to miss so the feedback
          loop has something to train on.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Red team inject failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {events.length === 0 ? (
        <Alert>
          <AlertTitle>No fixtures loaded</AlertTitle>
          <AlertDescription>
            The bench could not read <code>src/lib/data/red-team-events.ts</code>.
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {event.filename}
                  </p>
                </div>
                <Badge variant="outline">expect {event.expectedVerdict}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{event.notes}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onInject(event.id)}
              >
                {busy ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
                Inject event
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
