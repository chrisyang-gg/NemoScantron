"use client";

import { useState } from "react";
import { Composer } from "@/components/site/composer";
import { Fraudometer } from "@/components/site/fraudometer";
import {
  scoreSubmission,
  unlockSubmissions,
  type AttachedJson,
} from "@/lib/pipeline/client-scan";
import { cn } from "@/lib/utils";

type Phase = "compose" | "locked" | "editing";

export function ScanView() {
  const [phase, setPhase] = useState<Phase>("compose");
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachedJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [ignition, setIgnition] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [droppedNote, setDroppedNote] = useState<string | null>(null);

  const gaugeVisible = phase !== "compose";
  const locked = phase === "locked";

  function submit() {
    setBusy(true);
    setError(null);
    const result = scoreSubmission({ text, file });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setScore(result.score);
    setSummary(result.reasoning.explanation?.headline ?? result.reasoning.summary);
    setDroppedNote(
      result.droppedFields.length
        ? `Stripped ${result.droppedFields.length} extra field${
            result.droppedFields.length === 1 ? "" : "s"
          } before scoring.`
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
    setSummary(null);
    setDroppedNote(null);
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
          "flex flex-col items-center overflow-hidden transition-all duration-700 ease-in-out",
          gaugeVisible
            ? "mb-4 max-h-[460px] flex-1 opacity-100"
            : "mb-0 max-h-0 flex-none opacity-0",
        )}
        aria-hidden={!gaugeVisible}
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          {gaugeVisible ? (
            <>
              <p className="mb-1 text-[11px] tracking-[0.35em] text-violet-300/60 uppercase">
                Fraudometer
              </p>
              <Fraudometer score={score} ignition={ignition} />
              {summary ? (
                <p className="mt-1 max-w-md text-center text-sm text-violet-200/70">
                  {summary}
                </p>
              ) : null}
              {droppedNote ? (
                <p className="mt-2 max-w-md text-center text-xs text-violet-300/55">
                  {droppedNote}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

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
              className="h-11 rounded-xl bg-red-600 text-sm font-medium text-white shadow-[0_0_24px_rgba(220,38,38,0.35)] transition hover:bg-red-500"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={modify}
              className="h-11 rounded-xl bg-sky-300 text-sm font-medium text-slate-900 shadow-[0_0_24px_rgba(125,211,252,0.35)] transition hover:bg-sky-200"
            >
              Modify
            </button>
          </div>
        ) : null}

        <Composer
          text={text}
          file={file}
          locked={locked}
          busy={busy}
          error={error}
          onText={setText}
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
