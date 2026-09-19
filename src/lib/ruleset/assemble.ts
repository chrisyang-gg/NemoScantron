import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ASSEMBLY_ORDER } from "@/lib/ruleset/order";

export const RULESET_DIR = join(process.cwd(), "ruleset");

export function loadRulesetFiles(rulesetDir = RULESET_DIR): string {
  return ASSEMBLY_ORDER.map((filename) => {
    const text = readFileSync(join(rulesetDir, filename), "utf8").trim();
    if (!text) throw new Error(`Ruleset file ${filename} is empty.`);
    return text;
  }).join("\n\n");
}

export function assemblePrompt(
  transactionData: unknown,
  userContext?: string | null,
  rulesetDir = RULESET_DIR,
): string {
  if (transactionData == null) {
    throw new Error("Transaction data is required.");
  }
  const note = userContext?.trim() ?? "";
  const parts = [loadRulesetFiles(rulesetDir)];

  if (note) {
    parts.push(`=== USER CONTEXT START ===\n${note}\n=== USER CONTEXT END ===`);
  }

  const dataStr =
    typeof transactionData === "string"
      ? transactionData
      : JSON.stringify(transactionData, null, 2);

  parts.push(`=== TRANSACTION DATA START ===\n${dataStr}\n=== TRANSACTION DATA END ===`);
  parts.push(
    "Return only FILE 8 JSON: one object for a single record, an array for several. Escape every double quote inside strings. Do not copy risk_assessment.nemotron_explanation.",
  );
  return parts.join("\n\n");
}

export function readRulesetMetadataVersions(rulesetDir = RULESET_DIR) {
  const versions = {
    velocity_behavioral: "v1.0",
    geo_device: "v1.0",
    merchant_auth: "v1.0",
    attack_patterns: "v1.0",
    thresholds: "v1.0",
  };
  for (const filename of ASSEMBLY_ORDER) {
    const text = readFileSync(join(rulesetDir, filename), "utf8");
    const match = text.match(/version\s*:\s*(v[\d.]+)/i);
    if (!match) continue;
    if (filename.includes("velocity")) versions.velocity_behavioral = match[1];
    if (filename.includes("geo_device")) versions.geo_device = match[1];
    if (filename.includes("merchant_auth")) versions.merchant_auth = match[1];
    if (filename.includes("attack_patterns")) versions.attack_patterns = match[1];
    if (filename.includes("thresholds")) versions.thresholds = match[1];
  }
  return versions;
}
