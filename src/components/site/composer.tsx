"use client";

import { useRef, useState } from "react";
import { CornerDownLeft, FileJson, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedJson } from "@/lib/pipeline/client-scan";

export function Composer({
  text,
  file,
  locked,
  busy,
  error,
  onText,
  onFile,
  onReject,
  onSubmit,
}: {
  text: string;
  file: AttachedJson | null;
  locked: boolean;
  busy: boolean;
  error: string | null;
  onText: (value: string) => void;
  onFile: (file: AttachedJson | null) => void;
  onReject: (message: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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
    <form
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl border bg-[#140c22]/80 shadow-[0_0_0_1px_rgba(167,139,250,0.12),0_24px_80px_rgba(76,29,149,0.25)] backdrop-blur-md transition-all duration-700",
        dragging && !locked && "border-violet-400/70 shadow-[0_0_40px_rgba(167,139,250,0.35)]",
        locked
          ? "border-violet-950/80 opacity-55"
          : "border-violet-500/30 hover:border-violet-400/40",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (!locked && !busy) onSubmit();
      }}
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
      <textarea
        value={text}
        onChange={(event) => onText(event.target.value)}
        disabled={locked || busy}
        rows={7}
        placeholder="Paste a note about the charges, or drop a .json history…"
        className="min-h-[168px] w-full resize-none bg-transparent px-5 pt-4 pb-3 text-[15px] leading-relaxed text-violet-50 placeholder:text-violet-300/35 outline-none disabled:cursor-not-allowed"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !locked && !busy) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />

      {dragging && !locked ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-violet-950/50 text-sm text-violet-100">
          Drop a .json file
        </div>
      ) : null}

      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            disabled={locked || busy}
            onClick={() => inputRef.current?.click()}
            className="flex size-10 items-center justify-center rounded-xl border border-violet-400/20 bg-[#2a2038] text-violet-200/80 transition hover:bg-[#342848] disabled:pointer-events-none"
            aria-label="Upload JSON file"
          >
            <FileJson className="size-4" />
          </button>
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
              .json only
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={locked}
            onChange={(event) => {
              void takeFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        {locked ? (
          <span className="pr-2 text-[11px] tracking-wide text-violet-300/50 uppercase">
            Locked
          </span>
        ) : (
          <button
            type="submit"
            disabled={busy}
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
    </form>
  );
}
