import { defaultRules } from "@/lib/data/default-rules";
import { reasonWithNemotron } from "@/lib/pipeline/reasoning";
import { matchRules } from "@/lib/pipeline/ruleset";
import { sanitizeInput } from "@/lib/pipeline/sanitize";
import type { ReasoningResult } from "@/lib/pipeline/types";

export type AttachedJson = {
  name: string;
  text: string;
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
  const hits = matchRules(sanitized.text, defaultRules);
  const reasoning = reasonWithNemotron({ input, sanitized, hits });

  locked = true;
  return {
    ok: true,
    score: reasoning.riskScore,
    reasoning,
    filename: validated.filename,
  };
}

function validateIntake(request: ScanRequest):
  | { ok: true; rawText: string; filename?: string }
  | ScanFailure {
  const note = request.text.trim();
  const file = request.file;

  if (!note && !file) {
    return {
      ok: false,
      error: "Describe the activity or drop a .json history, then submit.",
    };
  }

  if (file) {
    if (!file.name.toLowerCase().endsWith(".json")) {
      return { ok: false, error: "Only .json files are accepted." };
    }
    if (!file.text.trim()) {
      return { ok: false, error: "That JSON file is empty." };
    }
    try {
      JSON.parse(file.text);
    } catch {
      return {
        ok: false,
        error: "The file is not valid JSON. Fix it, or Clear and try another.",
      };
    }
  }

  const rawText = [file ? flattenJson(JSON.parse(file.text)) : "", note]
    .filter(Boolean)
    .join("\n\n");

  if (!rawText.trim()) {
    return { ok: false, error: "Nothing to score after reading that input." };
  }

  return {
    ok: true,
    rawText,
    filename: file?.name,
  };
}

function flattenJson(value: unknown, depth = 0): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => flattenJson(item, depth + 1)).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${flattenJson(item, depth + 1)}`)
      .join("\n");
  }
  return "";
}
