"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload } from "lucide-react";

const SAMPLE_FILE = {
  filename: "transactions.csv",
  rawText: `date,amount,payee,memo
2026-09-12,184500.00,Harborline Treasury,CEO asked for a wire immediately
2026-09-12,184500.00,Harborline Treasury,new account — do not use the old
2026-09-13,250.00,Office coffee,routine
2026-09-14,41200.00,Acme Payments,keep this confidential gift card backup
`,
};

const SAMPLE_TEXT = `Over nine days AP sent a $184,500 wire that the CEO demanded immediately, then a second payment to a new Harborline account with instructions not to use the old one. A $41,200 vendor payout followed with a note to keep it confidential and a gift card backup if the wire was slow.`;

const DEFAULT_PROMPT = "Score this transaction history for fraud risk.";

export function ScanPanel({
  busy,
  error,
  onScan,
}: {
  busy: boolean;
  error: string | null;
  onScan: (payload: { prompt: string; rawText: string; filename?: string }) => void;
}) {
  const [mode, setMode] = useState("file");
  const [rawText, setRawText] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [localError, setLocalError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 200_000) {
      setLocalError("Keep history files under 200 KB.");
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    setRawText(text);
    setLocalError(null);
  }

  function submit() {
    if (!rawText.trim()) {
      setLocalError(
        mode === "file"
          ? "Upload a transaction history file, or load the sample."
          : "Describe the transaction history first.",
      );
      return;
    }
    setLocalError(null);
    onScan({
      prompt: DEFAULT_PROMPT,
      rawText,
      filename: filename ?? (mode === "text" ? "described-history.txt" : "transactions.txt"),
    });
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={mode}
        onValueChange={(value) => {
          if (typeof value === "string") {
            setMode(value);
            setLocalError(null);
          }
        }}
      >
        <TabsList variant="line">
          <TabsTrigger value="file">Upload a file</TabsTrigger>
          <TabsTrigger value="text">Describe in text</TabsTrigger>
        </TabsList>
        <TabsContent value="file" className="space-y-3 pt-4">
          <Label htmlFor="file">Transaction history file</Label>
          <label
            htmlFor="file"
            className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input px-3 py-3 text-sm text-muted-foreground hover:bg-muted/40"
          >
            <Upload className="size-4 shrink-0" />
            <span>
              {filename ?? "CSV, TXT, JSON, or EML of the payment history"}
            </span>
          </label>
          <input
            id="file"
            type="file"
            className="sr-only"
            accept=".txt,.csv,.eml,.json,.md"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {rawText && mode === "file" ? (
            <pre className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-2 font-mono text-[11px] whitespace-pre-wrap">
              {rawText}
            </pre>
          ) : null}
        </TabsContent>
        <TabsContent value="text" className="space-y-3 pt-4">
          <Label htmlFor="body">Describe the transaction history</Label>
          <Textarea
            id="body"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setFilename("described-history.txt");
            }}
            rows={12}
            placeholder="In your own words: who paid whom, amounts, dates, and anything that felt off."
          />
        </TabsContent>
      </Tabs>

      {(localError || error) && (
        <Alert variant="destructive">
          <AlertTitle>Could not start a scan</AlertTitle>
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          Get risk score
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            if (mode === "file") {
              setRawText(SAMPLE_FILE.rawText);
              setFilename(SAMPLE_FILE.filename);
            } else {
              setRawText(SAMPLE_TEXT);
              setFilename("described-history.txt");
            }
            setLocalError(null);
          }}
        >
          Load a sample
        </Button>
      </div>
    </div>
  );
}
