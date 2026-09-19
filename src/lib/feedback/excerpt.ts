import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MUTABLE_FILE_BY_KEY, type MutableKey } from "@/lib/ruleset/order";
import { RULESET_DIR } from "@/lib/ruleset/assemble";

export function excerptRulesFile(key: MutableKey, hints: string[]): string {
  const file = MUTABLE_FILE_BY_KEY[key];
  const text = readFileSync(join(RULESET_DIR, file), "utf8");
  const metadata = sliceBetween(text, "METADATA", "These rules") 
    || sliceBetween(text, "METADATA", "Attack patterns")
    || sliceBetween(text, "METADATA", "COMPOSITE")
    || text.slice(0, 700);
  const learnings = fromMarker(text, "RED-TEAM LEARNED") || fromMarker(text, "LEARNED");
  const ids = [...text.matchAll(/(?:rule_id|pattern_id)\s*:\s*([A-Z0-9-]+)/g)].map((m) => m[1]);
  const blocks = splitBlocks(text);
  const matched = blocks.filter((block) =>
    hints.some((hint) => hint && block.toUpperCase().includes(hint.toUpperCase())),
  );
  const chosen = matched.slice(0, 3);
  const parts = [
    `FILE ${file}`,
    metadata.trim(),
    chosen.length ? chosen.join("\n\n") : `rule_or_pattern_ids: ${ids.join(", ")}`,
    learnings?.trim() ?? "",
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, 4500);
}

function splitBlocks(text: string): string[] {
  return text
    .split(/\n(?=(?:RULE |PATTERN )[A-Z0-9-]+)/)
    .map((block) => block.trim())
    .filter((block) => /^(RULE |PATTERN )/.test(block));
}

function sliceBetween(text: string, start: string, end: string): string | null {
  const a = text.indexOf(start);
  const b = text.indexOf(end, a + 1);
  if (a < 0 || b < 0) return null;
  return text.slice(a, b);
}

function fromMarker(text: string, marker: string): string | null {
  const i = text.indexOf(marker);
  if (i < 0) return null;
  const end = text.indexOf("╔", i + 1);
  return text.slice(i, end > i ? end : undefined);
}
