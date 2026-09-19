"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload } from "lucide-react";

const SAMPLE = {
  filename: "vendor-change.eml",
  prompt: "AP forwarded this from a long-time vendor. Pay it?",
  rawText: `From: billing@acmepayments.co
Subject: Updated banking — pay invoice 8891 today

Hi, we changed banks. Do not use the old account.
Please wire $41,200 immediately to the new account on file.

Keep this confidential — our controller is traveling and asked
me to handle it personally. Gift card option if wire is too slow.
`,
};

export function ScanPanel({
  busy,
  error,
  onScan,
}: {
  busy: boolean;
  error: string | null;
  onScan: (payload: { prompt: string; rawText: string; filename?: string }) => void;
}) {
  const [prompt, setPrompt] = useState("Is this a legitimate payment request?");
  const [rawText, setRawText] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [localError, setLocalError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 200_000) {
      setLocalError("Keep sample files under 200 KB for this bench.");
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    setRawText(text);
    setLocalError(null);
  }

  function submit() {
    if (!rawText.trim()) {
      setLocalError("Paste a body or drop a text file.");
      return;
    }
    setLocalError(null);
    onScan({ prompt, rawText, filename });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-base">Website intake</h3>
        <p className="text-sm text-muted-foreground">
          Person A owns this box. Drop an email, CSV, or claim file plus the question you
          want Nemotron to answer. Sanitizing runs before anything else.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prompt">Analyst prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="What should Nemotron decide?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">File (optional)</Label>
          <label
            htmlFor="file"
            className="flex h-[76px] cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input px-3 text-sm text-muted-foreground hover:bg-muted/40"
          >
            <Upload className="size-4" />
            <span>{filename ?? "Drop .txt, .csv, .eml, .json"}</span>
          </label>
          <input
            id="file"
            type="file"
            className="sr-only"
            accept=".txt,.csv,.eml,.json,.md"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">File body</Label>
        <Textarea
          id="body"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            if (!filename) setFilename("pasted.txt");
          }}
          rows={10}
          className="font-mono text-xs md:text-xs"
          placeholder="Paste the email, invoice, or transaction dump here."
        />
      </div>

      {(localError || error) && (
        <Alert variant="destructive">
          <AlertTitle>Could not start a scan</AlertTitle>
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          Sanitize and scan
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            setPrompt(SAMPLE.prompt);
            setRawText(SAMPLE.rawText);
            setFilename(SAMPLE.filename);
            setLocalError(null);
          }}
        >
          Load a sample claim
        </Button>
      </div>
    </div>
  );
}
