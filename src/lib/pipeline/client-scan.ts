import { defaultRules } from "@/lib/data/default-rules";
import { reasonWithNemotron } from "@/lib/pipeline/reasoning";
import { matchRules } from "@/lib/pipeline/ruleset";
import { sanitizeInput } from "@/lib/pipeline/sanitize";
import {
  isAllowedJsonMime,
  isJsonFilename,
  parseJsonFile,
  sanitizeCreditCardJson,
  stringifySanitizedRecords,
} from "@/lib/pipeline/schema-sanitize";
import type { ReasoningResult } from "@/lib/pipeline/types";

export type AttachedJson = {
  name: string;
  text: string;
  mime?: string;
};

export type ScanRequest = {
  text: string;
  file: AttachedJson | null;
};

export type ScanSuccess = {
  ok: true;
  score: number;
  reasoning: ReasoningResult;
  filename?: string;
  droppedFields: string[];
};

export type ScanFailure = {
  ok: false;
  error: string;
};

export type ScanResponse = ScanSuccess | ScanFailure;

let locked = false;

export function submissionsLocked(): boolean {
  return locked;
}

export function unlockSubmissions(): void {
  locked = false;
}

export function lockSubmissions(): void {
  locked = true;
}

export function scoreSubmission(request: ScanRequest): ScanResponse {
  if (locked) {
    return {
      ok: false,
      error: "This scan is locked. Use Modify or Clear before sending again.",
    };
  }

  const validated = validateIntake(request);
  if (!validated.ok) return validated;

  const input = {
    id: `in_${crypto.randomUUID().slice(0, 8)}`,
    source: "website" as const,
    filename: validated.filename,
    prompt: "Score this transaction history for fraud risk.",
    rawText: validated.rawText,
    createdAt: new Date().toISOString(),
  };

  const sanitized = sanitizeInput(input);
  if (validated.droppedFields.length) {
    sanitized.stripped.push(
      `${validated.droppedFields.length} extra field(s) not in the credit-card schema`,
    );
    sanitized.warnings.push(
      `Removed fields before scoring: ${validated.droppedFields.slice(0, 8).join(", ")}${
        validated.droppedFields.length > 8 ? "…" : ""
      }.`,
    );
  }

  const hits = matchRules(sanitized.text, defaultRules);
  const reasoning = reasonWithNemotron({ input, sanitized, hits });

  locked = true;
  return {
    ok: true,
    score: reasoning.riskScore,
    reasoning,
    filename: validated.filename,
    droppedFields: validated.droppedFields,
  };
}

function validateIntake(request: ScanRequest):
  | { ok: true; rawText: string; filename?: string; droppedFields: string[] }
  | ScanFailure {
  const note = request.text.trim();
  const file = request.file;

  if (!file) {
    return {
      ok: false,
      error: "Attach a .json transaction file. Notes cannot be scored without it.",
    };
  }

  let cleaned = "";
  let droppedFields: string[] = [];
  let filename: string | undefined;

  if (file) {
    if (!isJsonFilename(file.name)) {
      return { ok: false, error: "Only .json files are accepted." };
    }
    if (!isAllowedJsonMime(file.mime)) {
      return { ok: false, error: "Only .json files are accepted." };
    }

    const parsed = parseJsonFile(file.text);
    if (!parsed.ok) return parsed;

    const sanitized = sanitizeCreditCardJson(parsed.value);
    if (!sanitized.ok) return sanitized;

    cleaned = stringifySanitizedRecords(sanitized.records);
    droppedFields = sanitized.dropped;
    filename = file.name;
  }

  const rawText = [note, cleaned].filter(Boolean).join("\n\n");
  if (!rawText.trim()) {
    return { ok: false, error: "Nothing to score after reading that input." };
  }

  return {
    ok: true,
    rawText,
    filename,
    droppedFields,
  };
}
