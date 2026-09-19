import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { callClaude, claudeStatus } from "@/lib/claude/call";
import { excerptRulesFile } from "@/lib/feedback/excerpt";
import { nemotronStatus } from "@/lib/nemotron/call";
import { runAnalyze } from "@/lib/nemotron/run-analyze";
import { parseModelJson } from "@/lib/nemotron/parse";
import type { NemotronAnalysis } from "@/lib/nemotron/types";
import { caseNeedsAttention, clampTestCount, keysNeedingAttention } from "@/lib/red-team/categories";
import { generateOneCase, type GeneratedCase } from "@/lib/red-team/generate-one";
import { GENERATION_SLOTS } from "@/lib/red-team/schema-brief";
import { compactRecord, stripGoldForScoring } from "@/lib/red-team/strip-gold";
import { IMMUTABLE_FILES, MUTABLE_FILE_BY_KEY, type MutableKey } from "@/lib/ruleset/order";
import { RULESET_DIR } from "@/lib/ruleset/assemble";

export type TrainProgress =
  | { phase: "start"; round: number; total: number }
  | { phase: "generating"; index: number; total: number; family: string; difficulty: string }
  | { phase: "created"; index: number; total: number; generated: GeneratedCase }
  | { phase: "scoring"; index: number; total: number; id: string }
  | { phase: "scored"; index: number; total: number; row: TrainRound["cases"][number] }
  | { phase: "claude"; files: string[] }
  | { phase: "done"; result: TrainRound };

export type TrainRound = {
  round: number;
  apply: boolean;
  dir: string;
  cases: {
    id: string;
    family: string;
    difficulty: string;
    expectedFraud: boolean;
    expectedDecision: string;
    description: string;
    trick: string;
    decision: string;
    risk_score: number;
    caught: boolean;
    needsAttention: boolean;
  }[];
  catchRate: number;
  falsePositiveRate: number;
  missed: string[];
  implicated: MutableKey[];
  changes: { file: string; applied: boolean; note: string }[];
  engines: { generate: string; score: string; trainer: string };
};

const STATE_PATH = join(process.cwd(), "ruleset", ".train-state.json");

export async function runTrainingRound(
  options: {
    apply?: boolean;
    count?: number;
    onProgress?: (event: TrainProgress) => void;
  } = {},
): Promise<TrainRound> {
  const apply = Boolean(options.apply);
  const total = clampTestCount(options.count);
  const emit = options.onProgress ?? (() => undefined);
  const round = nextRound();
  const dir = join(process.cwd(), "fixtures", "red-team", "rounds", `round-${String(round).padStart(3, "0")}`);
  mkdirSync(dir, { recursive: true });
  emit({ phase: "start", round, total });

  const generated: GeneratedCase[] = [];
  for (let index = 1; index <= total; index += 1) {
    const slot = GENERATION_SLOTS[(index - 1) % GENERATION_SLOTS.length];
    emit({
      phase: "generating",
      index,
      total,
      family: slot.family,
      difficulty: slot.difficulty,
    });
    const next = await generateOneCase({
      index,
      total,
      usedIds: generated.map((item) => item.id),
    });
    generated.push(next);
    writeFileSync(join(dir, `case-${String(index).padStart(2, "0")}.json`), JSON.stringify(next, null, 2));
    writeManifest(dir, generated, []);
    emit({ phase: "created", index, total, generated: next });
  }

  const analyses: { generated: GeneratedCase; analysis: NemotronAnalysis }[] = [];
  let scoreEngine = "nvidia-nemotron";
  for (const item of generated) {
    emit({ phase: "scoring", index: item.index, total, id: item.id });
    const result = await runAnalyze({
      notes: null,
      file: {
        name: `${item.family}.json`,
        text: JSON.stringify(stripGoldForScoring(item.record)),
        mime: "application/json",
      },
    });
    if (!result.ok) throw new Error(result.error);
    const analysis = result.analyses[0];
    if (!analysis) throw new Error(`Nemotron returned no analysis for ${item.id}.`);
    scoreEngine = result.engine;
    analyses.push({ generated: item, analysis });
    const row = toRow(item, analysis);
    writeManifest(dir, generated, analyses);
    emit({ phase: "scored", index: item.index, total, row });
  }

  const cases = analyses.map(({ generated: item, analysis }) => toRow(item, analysis));
  const fraud = cases.filter((item) => item.expectedFraud);
  const clean = cases.filter((item) => !item.expectedFraud);
  const catchRate = fraud.length
    ? Math.round((100 * fraud.filter((item) => item.caught).length) / fraud.length)
    : 0;
  const falsePositiveRate = clean.length
    ? Math.round((100 * clean.filter((item) => !item.caught).length) / clean.length)
    : 0;
  const missed = fraud.filter((item) => !item.caught).map((item) => item.family);
  const attentionCases = analyses.filter(({ generated: item, analysis }) =>
    caseNeedsAttention({
      expectedFraud: item.expectedFraud,
      expectedDecision: item.expectedDecision,
      analysis,
    }),
  );
  const implicated = uniqueKeys(
    attentionCases.flatMap(({ generated: item, analysis }) =>
      keysNeedingAttention({
        family: item.family,
        goldCategories: item.categories,
        expectedFraud: item.expectedFraud,
        expectedDecision: item.expectedDecision,
        analysis,
      }),
    ),
  );

  let changes: TrainRound["changes"] = [];
  const trainer = claudeStatus().label;
  if (!attentionCases.length) {
    changes = [{ file: "(none)", applied: false, note: "Scorer matched Nemotron gold on every case. No RULES file sent to Claude." }];
  } else {
    emit({ phase: "claude", files: implicated.map((key) => MUTABLE_FILE_BY_KEY[key]) });
    changes = await proposeWithClaude({
      round,
      apply,
      catchRate,
      falsePositiveRate,
      missed,
      implicated,
      analyses: attentionCases,
    });
  }

  const result: TrainRound = {
    round,
    apply,
    dir,
    cases,
    catchRate,
    falsePositiveRate,
    missed,
    implicated,
    changes,
    engines: {
      generate: nemotronStatus().label,
      score: scoreEngine,
      trainer,
    },
  };
  writeFileSync(join(dir, "round.json"), JSON.stringify(result, null, 2));
  if (apply) writeRound(round);
  emit({ phase: "done", result });
  return result;
}

function toRow(generated: GeneratedCase, analysis: NemotronAnalysis): TrainRound["cases"][number] {
  const severe = analysis.decision === "hold" || analysis.decision === "decline";
  const flagged = analysis.decision !== "approve";
  return {
    id: generated.id,
    family: generated.family,
    difficulty: generated.difficulty,
    expectedFraud: generated.expectedFraud,
    expectedDecision: generated.expectedDecision,
    description: generated.description,
    trick: generated.trick,
    decision: analysis.decision,
    risk_score: analysis.risk_score,
    caught: generated.expectedFraud ? flagged : !severe,
    needsAttention: caseNeedsAttention({
      expectedFraud: generated.expectedFraud,
      expectedDecision: generated.expectedDecision,
      analysis,
    }),
  };
}

async function proposeWithClaude(args: {
  round: number;
  apply: boolean;
  catchRate: number;
  falsePositiveRate: number;
  missed: string[];
  implicated: MutableKey[];
  analyses: { generated: GeneratedCase; analysis: NemotronAnalysis }[];
}): Promise<TrainRound["changes"]> {
  if (!args.implicated.length) {
    return [{ file: "(none)", applied: false, note: "No implicated RULES files." }];
  }

  const hints = args.analyses.flatMap(({ generated, analysis }) => [
    generated.family,
    ...generated.categories,
    ...analysis.rules_triggered,
    ...analysis.patterns_matched,
  ]);
  const excerpts = Object.fromEntries(
    args.implicated.map((key) => [key, excerptRulesFile(key, hints)]),
  );

  const reply = await callClaude({
    system:
      "You refine a credit-card fraud RULES pack. CORE files are immutable. Edit only the implicated RULES files you were given. Append at most one learned-adjustment line per file. Do not rewrite whole files. Return JSON { updates: [{ key, entry, summary }] }. key must be one of the implicated keys. entry is one line: [ROUND N | rule_or_pattern | change | rationale].",
    user: JSON.stringify(
      {
        round: args.round,
        catchRate: args.catchRate,
        falsePositiveRate: args.falsePositiveRate,
        missed: args.missed,
        immutableFiles: IMMUTABLE_FILES,
        implicated: args.implicated,
        cases: args.analyses.map(({ generated, analysis }) => ({
          family: generated.family,
          difficulty: generated.difficulty,
          gold_fraud: generated.expectedFraud,
          gold_decision: generated.expectedDecision,
          description: generated.description,
          trick: generated.trick,
          scored_decision: analysis.decision,
          risk_score: analysis.risk_score,
          rules: analysis.rules_triggered,
          patterns: analysis.patterns_matched,
          reasoning: analysis.reasoning.slice(0, 280),
          record: compactRecord(generated.record),
        })),
        rulesExcerpts: excerpts,
      },
      null,
      2,
    ),
    maxTokens: 1400,
  });

  if (!reply.ok) {
    return [{ file: "(claude)", applied: false, note: reply.error }];
  }

  const parsed = parseModelJson(reply.text);
  const updates = isRecord(parsed) && Array.isArray(parsed.updates) ? parsed.updates : [];
  const usable = updates
    .map((item) => {
      if (!isRecord(item)) return null;
      const key = String(item.key ?? "") as MutableKey;
      if (!args.implicated.includes(key) || !item.entry) return null;
      return { key, entry: String(item.entry), summary: String(item.summary ?? item.entry) };
    })
    .filter((item): item is { key: MutableKey; entry: string; summary: string } => Boolean(item));

  if (!usable.length) {
    return [{ file: "(claude)", applied: false, note: "Claude returned no usable RULES updates." }];
  }
  return usable.map((change) => applyMutableChange(change, args.apply));
}

function applyMutableChange(
  change: { key: MutableKey; entry: string; summary: string },
  apply: boolean,
): TrainRound["changes"][number] {
  const file = MUTABLE_FILE_BY_KEY[change.key];
  if (IMMUTABLE_FILES.includes(file as (typeof IMMUTABLE_FILES)[number])) {
    return { file, applied: false, note: "Refused: CORE files are immutable." };
  }
  if (!apply) {
    return { file, applied: false, note: change.summary };
  }
  const path = join(RULESET_DIR, file);
  let text = readFileSync(path, "utf8");
  text = bumpMetadata(text, change.summary);
  text = appendLearning(text, change.entry);
  writeFileSync(path, text);
  return { file, applied: true, note: change.summary };
}

function bumpMetadata(text: string, summary: string): string {
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  return text
    .replace(/(last_updated_round\s*:\s*)(\d+)/, (_, prefix: string, value: string) => {
      return `${prefix}${Number(value) + 1}`;
    })
    .replace(/(last_updated_timestamp\s*:\s*)\S+/, `$1${stamp}`)
    .replace(/(change_summary\s*:\s*).*/, `$1${summary.slice(0, 80)}`)
    .replace(/(red_team_change_rationale\s*:\s*).*/, `$1${summary.slice(0, 80)}`);
}

function appendLearning(text: string, entry: string): string {
  const markers = [
    "— No learnings recorded yet. Round 0 baseline. —",
    "— No threshold adjustments recorded yet. Round 0 baseline. —",
    "— No learned patterns recorded yet. Round 0 baseline. —",
  ];
  for (const marker of markers) {
    if (text.includes(marker)) return text.replace(marker, entry);
  }
  return `${text.trimEnd()}\n\n  ${entry}\n`;
}

function writeManifest(
  dir: string,
  generated: GeneratedCase[],
  analyses: { generated: GeneratedCase; analysis: NemotronAnalysis }[],
) {
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify(
      {
        created: generated.map((item) => ({
          index: item.index,
          id: item.id,
          family: item.family,
          difficulty: item.difficulty,
          expectedFraud: item.expectedFraud,
          expectedDecision: item.expectedDecision,
        })),
        scored: analyses.map(({ generated, analysis }) => ({
          id: generated.id,
          decision: analysis.decision,
          risk_score: analysis.risk_score,
        })),
      },
      null,
      2,
    ),
  );
}

function nextRound(): number {
  try {
    const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as { round?: number };
    return (state.round ?? 0) + 1;
  } catch {
    return 1;
  }
}

function writeRound(round: number) {
  mkdirSync(RULESET_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({ round }, null, 2));
}

function uniqueKeys(keys: MutableKey[]): MutableKey[] {
  return [...new Set(keys)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
