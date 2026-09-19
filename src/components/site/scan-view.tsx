"use client";

import { useState } from "react";
import { AnalysisCard } from "@/components/site/analysis-card";
import { Composer } from "@/components/site/composer";
import { Fraudometer } from "@/components/site/fraudometer";
import { analyzeSubmission, worstAnalysis } from "@/lib/nemotron/client-run";
import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { unlockSubmissions, type AttachedJson } from "@/lib/pipeline/client-scan";
import { cn } from "@/lib/utils";

type Phase = "compose" | "locked" | "editing";

export function ScanView() {
  const [phase, setPhase] = useState<Phase>("compose");
  const [notesKey, setNotesKey] = useState(0);
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachedJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [ignition, setIgnition] = useState(0);
  const [analysis, setAnalysis] = useState<NemotronAnalysis | null>(null);
  const [engine, setEngine] = useState("nemoscantron-local (ruleset mock)");
  const [usedMock, setUsedMock] = useState(true);
  const [droppedNote, setDroppedNote] = useState<string | null>(null);

  const gaugeVisible = phase !== "compose";
  const locked = phase === "locked";

  async function submit(notes: string) {
    setText(notes);
    setBusy(true);
    setError(null);
    const result = await analyzeSubmission({ notes, file });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    const primary = worstAnalysis(result.analyses);
    setBusy(false);
    setAnalysis(primary);
    setEngine(result.engine);
    setUsedMock(result.usedMock);
    setScore(Math.round(primary.risk_score * 100));
    setDroppedNote(
      result.droppedFields.length
        ? `Stripped ${result.droppedFields.length} extra field${
            result.droppedFields.length === 1 ? "" : "s"
          } before the ruleset.`
        : null,
    );
    setIgnition((value) => value + 1);
    setPhase("locked");
  }

  function clearAll() {
    unlockSubmissions();
    setText("");
    setFile(null);
    setError(null);
    setScore(0);
    setAnalysis(null);
    setDroppedNote(null);
    setNotesKey((value) => value + 1);
    setPhase("compose");
  }

  function modify() {
    unlockSubmissions();
    setError(null);
    setPhase("editing");
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-3xl flex-col px-4 py-6 md:px-6">
      <div
        className={cn(
          "pointer-events-none flex flex-col items-center overflow-hidden transition-all duration-700 ease-in-out",
          gaugeVisible
            ? "mb-3 max-h-[360px] flex-none opacity-100"
            : "mb-0 max-h-0 flex-none opacity-0",
        )}
        aria-hidden={!gaugeVisible}
        inert={!gaugeVisible ? true : undefined}
      >
        <p className="mb-1 text-[11px] tracking-[0.35em] text-violet-300/60 uppercase">
          Fraudometer
        </p>
        <Fraudometer score={score} ignition={ignition} />
      </div>

      {analysis && gaugeVisible ? (
        <div className="mx-auto mb-4 flex w-full justify-center">
          <AnalysisCard
            analysis={analysis}
            engine={engine}
            usedMock={usedMock}
            extra={droppedNote}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "mx-auto flex w-full max-w-[640px] flex-col gap-3 transition-all duration-700 ease-in-out",
          phase === "compose" && "my-auto",
          phase === "locked" && "mt-auto mb-4",
          phase === "editing" && "mt-2 mb-8",
        )}
      >
        {phase !== "compose" ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={clearAll}
              className="h-11 rounded-xl bg-[#6e4a4a] text-sm font-medium text-[#f0d6d4] transition hover:bg-[#7d5555]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={modify}
              className="h-11 rounded-xl bg-[#4a5c68] text-sm font-medium text-[#d8e2e8] transition hover:bg-[#556875]"
            >
              Modify
            </button>
          </div>
        ) : null}

        <Composer
          key={notesKey}
          initialText={text}
          file={file}
          locked={locked}
          busy={busy}
          error={error}
          onFile={(next) => {
            setFile(next);
            setError(null);
          }}
          onReject={setError}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
