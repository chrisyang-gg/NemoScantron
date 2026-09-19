import type { SanitizedInput, ScanInput } from "@/lib/pipeline/types";

const INJECTION_PHRASES = [
  "ignore previous instructions",
  "ignore all previous",
  "system prompt",
  "you are now",
  "developer mode",
];

const HTML_TAG = /<[^>]*>/g;
const CARD = /\b(?:\d[ -]*?){13,19}\b/g;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const MAX_CHARS = 20_000;

export function sanitizeInput(input: ScanInput): SanitizedInput {
  const stripped: string[] = [];
  const warnings: string[] = [];
  let text = input.rawText.replace(/\0/g, "");

  if (text.length !== input.rawText.length) {
    stripped.push("null bytes");
  }

  const html = text.match(HTML_TAG);
  if (html?.length) {
    text = text.replace(HTML_TAG, " ");
    stripped.push(`${html.length} HTML tag${html.length === 1 ? "" : "s"}`);
  }

  const masked: { label: string; count: number }[] = [];
  text = mask(text, CARD, "card", masked);
  text = mask(text, SSN, "ssn", masked);
  text = mask(text, EMAIL, "email", masked);

  const lower = text.toLowerCase();
  for (const phrase of INJECTION_PHRASES) {
    if (lower.includes(phrase)) {
      warnings.push(`Possible prompt-injection phrase: “${phrase}”`);
    }
  }

  if (!input.prompt.trim()) {
    warnings.push("Analyst prompt is empty; reasoning will use a default question.");
  }

  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    stripped.push(`truncated to ${MAX_CHARS} characters`);
  }

  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!text) {
    warnings.push("Nothing left after sanitizing. The run will score as empty input.");
  }

  return {
    text,
    originalChars: input.rawText.length,
    stripped,
    warnings,
    masked,
  };
}

function mask(
  text: string,
  pattern: RegExp,
  label: string,
  bucket: { label: string; count: number }[],
): string {
  const copy = new RegExp(pattern.source, pattern.flags);
  const matches = text.match(copy);
  if (!matches?.length) return text;
  bucket.push({ label, count: matches.length });
  return text.replace(copy, `[${label}]`);
}
