"use client";

import { useState, useSyncExternalStore } from "react";
import { AnalysisCard } from "@/components/site/analysis-card";
import { Composer } from "@/components/site/composer";
import { EnterpriseDashboard } from "@/components/site/dashboard/enterprise-dashboard";
import { Fraudometer } from "@/components/site/fraudometer";
import { RecommendationPanel } from "@/components/site/recommendation-panel";
import { TransactionMap } from "@/components/site/transaction-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  appendScoredEvents,
  getHistorySnapshot,
  getServerHistorySnapshot,
  saveHistory,
  subscribeHistory,
} from "@/lib/history/store";
import { analyzeSubmission, worstAnalysis } from "@/lib/nemotron/client-run";
import { prepareRecords } from "@/lib/nemotron/intake";
import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { unlockSubmissions, type AttachedJson } from "@/lib/pipeline/client-scan";

type WorkspaceTab = "modify" | "recommendation" | "map" | "dashboard";

export function ScanView() {
  const [tab, setTab] = useState<WorkspaceTab>("modify");
  const [notesKey, setNotesKey] = useState(0);
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachedJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [ignition, setIgnition] = useState(0);
  const [analyses, setAnalyses] = useState<NemotronAnalysis[]>([]);
  const [engine, setEngine] = useState("nvidia-nemotron");
  const [droppedNote, setDroppedNote] = useState<string | null>(null);
  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );

  const analysis = analyses[0] ? worstAnalysis(analyses) : null;

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
    const intake = prepareRecords({ notes, file });
    const nextHistory =
      intake.ok ? appendScoredEvents(intake.records, result.analyses, history) : history;
    if (intake.ok) saveHistory(nextHistory);
    const primary = worstAnalysis(result.analyses);
    setBusy(false);
    setAnalyses(result.analyses);
    setEngine(result.engine);
    setScore(Math.round(primary.risk_score * 100));
    setDroppedNote(
      result.droppedFields.length
        ? `Stripped ${result.droppedFields.length} extra field${
            result.droppedFields.length === 1 ? "" : "s"
          } before the ruleset.`
        : null,
    );
    setIgnition((value) => value + 1);
  }

  function clearAll() {
    unlockSubmissions();
    setText("");
    setFile(null);
    setError(null);
    setScore(0);
    setAnalyses([]);
    setDroppedNote(null);
    setNotesKey((value) => value + 1);
    setTab("modify");
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-6 md:px-6">
      <div className="grid items-stretch gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/15 bg-[#140c22]/40 px-2 pt-3">
          <p className="mb-1 text-[11px] tracking-[0.35em] text-violet-300/60 uppercase">
            Fraudometer
          </p>
          <Fraudometer score={score} ignition={ignition} />
        </div>
        <AnalysisCard
          analysis={analysis}
          engine={engine}
          extra={droppedNote}
          onClear={clearAll}
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === "modify" || value === "recommendation" || value === "map" || value === "dashboard") {
            setTab(value);
          }
        }}
        className="mt-8 gap-0"
      >
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-6 rounded-none bg-transparent p-0"
        >
          <TabsTrigger
            value="modify"
            className="h-auto flex-none px-0 pb-3 text-[13px] tracking-[0.16em] text-violet-300/55 uppercase data-active:text-violet-50"
          >
            Modify Input
          </TabsTrigger>
          <TabsTrigger
            value="recommendation"
            className="h-auto flex-none px-0 pb-3 text-[13px] tracking-[0.16em] text-violet-300/55 uppercase data-active:text-violet-50"
          >
            Recommendation
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="h-auto flex-none px-0 pb-3 text-[13px] tracking-[0.16em] text-violet-300/55 uppercase data-active:text-violet-50"
          >
            Transaction Map
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="h-auto flex-none px-0 pb-3 text-[13px] tracking-[0.16em] text-violet-300/55 uppercase data-active:text-violet-50"
          >
            Enterprise Dashboard
          </TabsTrigger>
        </TabsList>
        <div className="mb-6 h-px w-full bg-violet-400/20" />

        <TabsContent value="modify" className="mx-auto w-full max-w-[640px] pb-10">
          <Composer
            key={notesKey}
            initialText={text}
            file={file}
            locked={busy}
            busy={busy}
            error={error}
            onFile={(next) => {
              setFile(next);
              setError(null);
            }}
            onReject={setError}
            onSubmit={submit}
          />
        </TabsContent>
        <TabsContent value="recommendation" className="pb-10">
          <RecommendationPanel analyses={analyses} />
        </TabsContent>
        <TabsContent value="map" className="pb-10">
          <TransactionMap events={history} />
        </TabsContent>
        <TabsContent value="dashboard" className="pb-10">
          <EnterpriseDashboard events={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
