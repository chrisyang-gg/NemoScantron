import type { Rule, RuleHit } from "@/lib/pipeline/types";

export function matchRules(text: string, rules: Rule[]): RuleHit[] {
  const haystack = text.toLowerCase();
  const hits: RuleHit[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const evidence = rule.signals.filter((signal) =>
      haystack.includes(signal.toLowerCase()),
    );
    if (evidence.length >= rule.minHits) {
      hits.push({
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        policy: rule.policy,
        evidence,
      });
    }
  }

  return hits;
}

export function nearMisses(
  text: string,
  rules: Rule[],
): { ruleId: string; title: string; present: string[]; missing: number }[] {
  const haystack = text.toLowerCase();
  const misses: {
    ruleId: string;
    title: string;
    present: string[];
    missing: number;
  }[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const present = rule.signals.filter((signal) =>
      haystack.includes(signal.toLowerCase()),
    );
    if (present.length > 0 && present.length < rule.minHits) {
      misses.push({
        ruleId: rule.id,
        title: rule.title,
        present,
        missing: rule.minHits - present.length,
      });
    }
  }

  return misses;
}

export function allSignals(rules: Rule[]): string[] {
  return [...new Set(rules.filter((rule) => rule.enabled).flatMap((rule) => rule.signals))];
}

export function nextRuleId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
