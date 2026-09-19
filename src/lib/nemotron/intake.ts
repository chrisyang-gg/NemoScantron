import {
  isAllowedJsonMime,
  isJsonFilename,
  parseJsonFile,
  sanitizeCreditCardJson,
} from "@/lib/pipeline/schema-sanitize";

export type AnalyzeInput = {
  notes?: string | null;
  file: { name: string; text: string; mime?: string } | null;
};

export function prepareRecords(input: AnalyzeInput):
  | {
      ok: true;
      records: Record<string, unknown>[];
      notes: string | null;
      dropped: string[];
      filename: string;
    }
  | { ok: false; error: string } {
  const notes = input.notes?.trim() || null;
  const file = input.file;
  if (!file) {
    return {
      ok: false,
      error: "Attach a .json transaction file. Notes cannot be scored without it.",
    };
  }
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
  return {
    ok: true,
    records: sanitized.records,
    notes,
    dropped: sanitized.dropped,
    filename: file.name,
  };
}
