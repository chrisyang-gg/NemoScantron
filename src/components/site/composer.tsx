"use client";

import { useRef, useState } from "react";
import { CornerDownLeft, FileJson, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedJson } from "@/lib/pipeline/client-scan";

export function Composer({
  initialText,
  file,
  locked,
  busy,
  error,
  onFile,
  onReject,
  onSubmit,
}: {
  initialText: string;
  file: AttachedJson | null;
  locked: boolean;
  busy: boolean;
  error: string | null;
  onFile: (file: AttachedJson | null) => void;
  onReject: (message: string) => void;
  onSubmit: (notes: string) => void;
}) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);

  function notes() {
    return textRef.current?.value ?? "";
  }

  function focusNotes() {
    if (!locked) textRef.current?.focus();
  }

  async function takeFile(next: File | undefined) {
    if (!next || locked) return;
    const name = next.name.toLowerCase();
    const mime = next.type.toLowerCase();
    if (!name.endsWith(".json")) {
      onReject("Only .json files are accepted.");
      return;
    }
    if (
      mime &&
      mime !== "application/json" &&
      mime !== "text/json" &&
      mime !== "application/x-json" &&
      mime !== "application/octet-stream" &&
      mime !== "text/plain"
    ) {
      onReject("Only .json files are accepted.");
      return;
    }
    if (next.size > 200_000) {
      onReject("Keep JSON files under 200 KB.");
      return;
    }
    onFile({ name: next.name, text: await next.text(), mime: next.type });
  }

  return (
    <div
      className={cn(
        "relative z-20 flex w-full flex-col overflow-hidden rounded-2xl border bg-[#140c22] shadow-[0_0_0_1px_rgba(167,139,250,0.12),0_24px_80px_rgba(76,29,149,0.25)]",
        dragging && !locked && "border-violet-400/70",
        locked ? "border-violet-950/80 opacity-55" : "border-violet-500/30",
      )}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, input, textarea, label, a")) return;
        event.preventDefault();
        focusNotes();
      }}
    >
      <label htmlFor="composer-notes" className="sr-only">
        Notes to put on top of the JSON file
      </label>
      <textarea
        id="composer-notes"
        ref={textRef}
        name="notes"
        defaultValue={initialText}
        autoFocus
        autoComplete="off"
        autoCorrect="on"
        spellCheck
        rows={8}
        tabIndex={0}
        {...(locked ? { readOnly: true } : {})}
        placeholder="Click here and type. These lines go on top of the JSON file when you submit."
        className="relative z-20 min-h-[180px] w-full cursor-text resize-none border-0 bg-[#1c142c] px-5 pt-4 pb-3 text-[16px] leading-relaxed text-violet-50 caret-violet-100 outline-none select-text selection:bg-violet-500/40 placeholder:text-violet-200/55"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !locked && !busy) {
            event.preventDefault();
            onSubmit(notes());
          }
        }}
      />

      <div className="relative z-20 flex items-center justify-between px-3 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <label
            className={cn(
              "flex size-10 cursor-pointer items-center justify-center rounded-xl border border-violet-400/20 bg-[#2a2038] text-violet-200/80 transition hover:bg-[#342848]",
              (locked || busy) && "pointer-events-none opacity-50",
            )}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!locked) setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void takeFile(event.dataTransfer.files[0]);
            }}
          >
            <FileJson className="size-4" />
            <input
              type="file"
              accept=".json,application/json"
              hidden
              disabled={locked}
              onChange={(event) => {
                void takeFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <span className="sr-only">Upload JSON file</span>
          </label>
          {file ? (
            <span className="flex min-w-0 items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-100">
              <span className="truncate">{file.name}</span>
              {locked ? null : (
                <button
                  type="button"
                  className="text-violet-200 hover:text-white"
                  onClick={() => onFile(null)}
                  aria-label="Remove file"
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ) : (
            <span className="hidden text-xs text-violet-300/45 sm:inline">
              {dragging ? "Drop JSON" : ".json only"}
            </span>
          )}
        </div>

        {locked ? (
          <span className="pr-2 text-[11px] tracking-wide text-violet-300/50 uppercase">
            Locked
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onSubmit(notes())}
            className="flex size-10 items-center justify-center rounded-xl bg-[#6b5b7a] text-[#efe8f4] transition hover:bg-[#7a6a89] disabled:opacity-60"
            aria-label="Submit"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CornerDownLeft className="size-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="border-t border-[#6e4a4a]/50 bg-[#3a2428]/70 px-4 py-3 text-sm leading-relaxed text-[#e8cfcb]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
