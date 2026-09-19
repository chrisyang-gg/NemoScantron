import {
  DECISIONS,
  type NemotronAnalysis,
  type NemotronDecision,
} from "./types";

const BROKEN_JSON_MESSAGE =
  "Nemotron returned a broken JSON score. Submit again — long histories sometimes get cut off.";

export function parseNemotronOutput(raw: string): NemotronAnalysis[] {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  const start =
    startArr >= 0 && (startObj < 0 || startArr < startObj) ? startArr : startObj;
  if (start < 0) {
    throw new Error("Nemotron did not return JSON.");
  }

  const sliced = cleaned.slice(start);
  const parsed = tryParseJson(sliced);
  if (parsed === undefined) {
    throw new Error(BROKEN_JSON_MESSAGE);
  }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (!list.length) {
    throw new Error("Nemotron returned an empty score list.");
  }
  return list.map(normalizeAnalysis);
}

export function isRawJsonParseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /JSON|Expected|Unexpected|position \d+/i.test(message);
}

function tryParseJson(text: string): unknown {
  const attempts = [text, stripTrailingCommas(text), repairLooseJson(text)];
  for (const attempt of attempts) {
    const candidate = closeTruncated(attempt);
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }
  const objects = extractObjects(repairLooseJson(text));
  return objects.length ? objects : undefined;
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

/**
 * LLM scores often break JSON with inner quotes, raw newlines, or a cut-off
 * last object. Repair those without changing valid JSON.
 */
export function repairLooseJson(text: string): string {
  let out = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (!inString) {
      if (ch === '"') {
        inString = true;
        out += ch;
        continue;
      }
      if (ch === "/" && text[i + 1] === "/") {
        while (i < text.length && text[i] !== "\n") i += 1;
        continue;
      }
      out += ch;
      continue;
    }

    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      if (isStructuralQuoteCloser(text, i)) {
        inString = false;
        out += ch;
      } else {
        out += '\\"';
      }
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code < 32) {
      out += JSON.stringify(ch).slice(1, -1);
      continue;
    }
    out += ch;
  }

  if (inString) out += '"';
  return closeTruncated(stripTrailingCommas(out));
}

function isStructuralQuoteCloser(text: string, quoteIndex: number): boolean {
  let i = quoteIndex + 1;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  if (i >= text.length) return true;
  return ",}]:".includes(text[i]);
}

function closeTruncated(text: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (const ch of text) {
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = text;
  if (inString) out += '"';
  while (stack.length) {
    const closer = stack.pop();
    out = stripTrailingCommas(out) + closer;
  }
  return stripTrailingCommas(out);
}

function extractObjects(text: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{") {
      i += 1;
      continue;
    }
    const end = matchingBrace(text, i);
    if (end < 0) {
      const repaired = repairLooseJson(text.slice(i));
      try {
        const value = JSON.parse(repaired);
        if (value && typeof value === "object" && !Array.isArray(value)) {
          out.push(value as Record<string, unknown>);
        }
      } catch {
        // skip this fragment
      }
      break;
    }
    try {
      const value = JSON.parse(repairLooseJson(text.slice(i, end + 1)));
      if (value && typeof value === "object" && !Array.isArray(value)) {
        out.push(value as Record<string, unknown>);
      }
    } catch {
      // skip this fragment
    }
    i = end + 1;
  }
  return out;
}

function matchingBrace(text: string, start: number): number {
  let depth = 0;
  let quote: string | null = null;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function normalizeAnalysis(value: unknown): NemotronAnalysis {
  if (!isRecord(value)) throw new Error("Nemotron output is not an object.");
  const decision = String(value.decision ?? "");
  if (!DECISIONS.includes(decision as NemotronDecision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }
  const breakdown = isRecord(value.risk_score_breakdown) ? value.risk_score_breakdown : {};
  const versions = isRecord(value.ruleset_versions_applied)
    ? value.ruleset_versions_applied
    : {};
  const indicators = Array.isArray(value.fraud_indicators)
    ? value.fraud_indicators.filter(isRecord).map((item) => ({
        indicator: String(item.indicator ?? "signal"),
        severity: normalizeSeverity(item.severity),
        detail: String(item.detail ?? ""),
      }))
    : [];

  return {
    transaction_id: String(value.transaction_id ?? "unknown"),
    analysis_timestamp: String(value.analysis_timestamp ?? new Date().toISOString()),
    risk_score: clamp01(value.risk_score),
    decision: decision as NemotronDecision,
    confidence: clamp01(value.confidence),
    rules_triggered: stringArray(value.rules_triggered),
    patterns_matched: stringArray(value.patterns_matched),
    fraud_indicators: indicators,
    risk_score_breakdown: {
      velocity_behavioral: clamp01(breakdown.velocity_behavioral),
      geo_device: clamp01(breakdown.geo_device),
      merchant_auth: clamp01(breakdown.merchant_auth),
      pattern_boost: Math.min(0.35, clamp01(breakdown.pattern_boost)),
    },
    reasoning: String(value.reasoning ?? ""),
    recommended_action: String(value.recommended_action ?? ""),
    escalate_to_analyst: Boolean(value.escalate_to_analyst),
    ruleset_versions_applied: {
      velocity_behavioral: String(versions.velocity_behavioral ?? "v1.0"),
      geo_device: String(versions.geo_device ?? "v1.0"),
      merchant_auth: String(versions.merchant_auth ?? "v1.0"),
      attack_patterns: String(versions.attack_patterns ?? "v1.0"),
      thresholds: String(versions.thresholds ?? "v1.0"),
    },
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function clamp01(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
}

function normalizeSeverity(value: unknown): FraudIndicatorSeverity {
  const text = String(value ?? "medium");
  if (text === "low" || text === "medium" || text === "high" || text === "critical") {
    return text;
  }
  return "medium";
}

type FraudIndicatorSeverity = "low" | "medium" | "high" | "critical";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
