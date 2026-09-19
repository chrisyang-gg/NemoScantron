import { attackFamilies, getAttackFamily, type AttackFamilyId } from "@/lib/data/attack-families";
import { completeJson, aiStatus, type AgentEngine } from "@/lib/ai/engine";
import { allSignals, matchRules } from "@/lib/pipeline/ruleset";
import type { GeneratedAttack, Rule, Verdict } from "@/lib/pipeline/types";

export type RedTeamRequest = {
  family?: string;
  brief?: string;
};

const PARAPHRASE: Record<string, string> = {
  ceo: "principal",
  cfo: "finance lead",
  urgent: "time-sensitive",
  immediately: "before the window closes",
  wire: "remittance",
  transfer: "movement",
  today: "this session",
  "new account": "replacement destination",
  "updated banking": "revised settlement path",
  routing: "settlement coordinates",
  "do not use the old": "the prior destination is retired",
  "wire instead": "use the replacement rail",
  "send to this account": "settle to the coordinates below",
  "gift card": "closed-loop voucher",
  bitcoin: "on-chain asset",
  usdt: "stable token",
  "crypto wallet": "on-chain address",
  "wallet address": "on-chain address",
  "keep this confidential": "keep the circle small",
  "don't tell": "no extra distribution",
  "do not tell": "no extra distribution",
  "between us": "limited distribution",
  "handle personally": "handle at your desk",
  "skip the usual": "bypass the standing path",
  "off the record": "unlogged",
  "invoice #": "billing reference",
  resubmit: "send through again",
  duplicate: "second copy",
  nigeria: "lagos corridor",
  offshore: "non-resident",
  "hong kong": "HK desk",
  "after hours": "outside the window",
  sunday: "end-of-week",
  midnight: "late cycle",
  swift: "cross-border message",
  intern: "junior coordinator",
  "one letter off": "single-glyph drift",
  lookalike: "near-match legal name",
  "opened 3 days ago": "opened this week",
  "no invoice number": "no billing reference",
  "contractor payout": "outside-staff settlement",
};

const PEOPLE = [
  "Morgan Hale",
  "Priya Raman",
  "Devon Blake",
  "Samira Okonkwo",
  "Ellis Cho",
  "Jordan Voss",
];
const VENDORS = [
  ["Acme Payroll Inc", "Acme Payrol LLC"],
  ["Summit Freight Co", "Summit Freigt Co"],
  ["Palisade Labs", "Palisade Labss"],
  ["Rivermark Consulting", "Rivermrk Consulting"],
];

export async function generateRedTeamEvent(
  rules: Rule[],
  request: RedTeamRequest,
): Promise<GeneratedAttack> {
  const family = getAttackFamily(request.family);
  const fromModel = await generateWithNemotron(rules, family.id, request.brief);
  if (fromModel) return fromModel;
  return generateLocal(rules, family.id, request.brief);
}

async function generateWithNemotron(
  rules: Rule[],
  family: AttackFamilyId,
  brief: string | undefined,
): Promise<GeneratedAttack | null> {
  const familyMeta = getAttackFamily(family);
  const result = await completeJson<{
    name?: string;
    filename?: string;
    prompt?: string;
    body?: string;
    expectedVerdict?: Verdict;
    attackPlan?: string;
    evadeNotes?: string[];
  }>({
    system:
      "You are the NemoScantron red-team agent. Write one synthetic payment-fraud (or clean-control) document. Return JSON only. Never use the live ruleset's signal strings in a fraud body if the family is meant to evade. The body must look like a real email, CSV, or AP note.",
    user: JSON.stringify(
      {
        family,
        goal: familyMeta.goal,
        analystBrief: brief ?? "",
        expectedVerdict: familyMeta.expectedVerdict,
        liveRules: rules
          .filter((rule) => rule.enabled)
          .map((rule) => ({
            title: rule.title,
            signals: rule.signals,
            minHits: rule.minHits,
            severity: rule.severity,
          })),
      },
      null,
      2,
    ),
  });
  if (!result?.data.body) return null;
  const data = result.data;
  const expected = data.expectedVerdict === "clear" ? "clear" : familyMeta.expectedVerdict;
  const rawBody = data.body;
  if (!rawBody) return null;
  const body = evadeSignals(rawBody, rules, expected);
  return stamp(
    {
      family,
      name: data.name || familyMeta.name,
      filename: data.filename || `${family}.txt`,
      prompt: data.prompt || "AI red team wants a second opinion on this payload.",
      body,
      expectedVerdict: expected,
      attackPlan: data.attackPlan || familyMeta.goal,
      evadeNotes: data.evadeNotes ?? [],
    },
    result.engine,
  );
}

function generateLocal(
  rules: Rule[],
  family: AttackFamilyId,
  brief: string | undefined,
): GeneratedAttack {
  const pick = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
  const vendor = VENDORS[Math.floor(Math.random() * VENDORS.length)];
  const amount = (32_000 + Math.floor(Math.random() * 90) * 100).toLocaleString("en-US");
  const stampId = crypto.randomUUID().slice(0, 4);
  const extra = brief?.trim() ? `\n\nDesk note from the operator: ${brief.trim()}` : "";

  let draft: Omit<GeneratedAttack, "id" | "engine" | "createdAt">;

  switch (family) {
    case "clean":
      draft = {
        family,
        name: `Payroll batch ${stampId}`,
        filename: `payroll-${stampId}.csv`,
        prompt: "Routine payroll. Anything off?",
        expectedVerdict: "clear",
        attackPlan:
          "Negative control. Ordinary approved payroll with masked accounts and no social-engineering pressure.",
        evadeNotes: ["no adversary content"],
        body: `batch,payroll,2026-09-19
employee,hours,rate,amount,account
${pick},40,48.50,1940.00,****2211
Riley Chen,40,52.00,2080.00,****7740
Memo: Standard biweekly payroll, approved by HR on 2026-09-18.${extra}
`,
      };
      break;
    case "refund-mule":
      draft = {
        family,
        name: `Refund rail swap ${stampId}`,
        filename: `refund-${stampId}.txt`,
        prompt: "Customer wants the refund on a different card. Approve?",
        expectedVerdict: "fraud",
        attackPlan:
          "Move a refund onto a rail the original payer never used. Avoid crypto/gift-card wording so POL-RAIL-02 stays quiet.",
        evadeNotes: [],
        body: `Helpdesk ticket ${stampId}

Shopper ${pick} wants the $2,140 refund for order ${8000 + Math.floor(Math.random() * 900)} sent to the card they just added. The original card was declined for the credit.

Please push the refund tonight so the review window does not lapse.${extra}
`,
      };
      break;
    case "lookalike-vendor":
      draft = {
        family,
        name: `Lookalike ${vendor[1]}`,
        filename: `vendor-${stampId}.txt`,
        prompt: "AP wants a second opinion on this outside-staff settlement.",
        expectedVerdict: "fraud",
        attackPlan: `Settle ${amount} to a mule destination under ${vendor[1]}, a single-glyph drift from ${vendor[0]}. Avoid any signal the live pack already scores.`,
        evadeNotes: [],
        body: `Onboarding last Tuesday for ${vendor[1]}.

Pay $${amount} to a destination opened this week at Northline Credit.
Legal name on the W-9 is ${vendor[0]}. Intake spells it ${vendor[1]}.
No billing reference. Approver is the junior coordinator who created the vendor record.${extra}
`,
      };
      break;
    case "authority":
    case "evade":
    default:
      draft = {
        family,
        name: `Closing remittance ${stampId}`,
        filename: `closing-${stampId}.eml`,
        prompt: "Is this a legitimate closing remittance?",
        expectedVerdict: "fraud",
        attackPlan:
          "Impersonate the principal's office and retire the prior destination without using CEO, urgent, wire, or new-account phrasing.",
        evadeNotes: [],
        body: `From: ${pick} <${pick.split(" ")[0].toLowerCase()}@nemoscantron-mail.com>
Subject: Closing binder — remittance this session

I am with the principal's office on a flight. Complete the closing remittance of $${amount} to Harborline Treasury before the notary window ends.

The prior destination is retired. Use the replacement destination on the attached sheet. Keep the circle small until Monday.${extra}
`,
      };
  }

  const body = evadeSignals(draft.body, rules, draft.expectedVerdict);
  const residual = matchRules(body, rules).flatMap((hit) => hit.evidence);
  const evadeNotes =
    draft.expectedVerdict === "clear"
      ? draft.evadeNotes
      : residual.length
        ? [`residual signals still present: ${residual.join(", ")}`]
        : [`scrubbed ${allSignals(rules).length} live signals`];

  return stamp({ ...draft, body, evadeNotes }, aiStatus());
}

function evadeSignals(body: string, rules: Rule[], expected: Verdict): string {
  if (expected === "clear") return body;
  let next = body;
  for (let pass = 0; pass < 4; pass += 1) {
    const hits = matchRules(next, rules);
    if (!hits.length) break;
    for (const hit of hits) {
      for (const signal of hit.evidence) {
        const replacement = PARAPHRASE[signal.toLowerCase()] ?? "that item";
        next = replaceAll(next, signal, replacement);
      }
    }
  }
  return next;
}

function replaceAll(haystack: string, needle: string, replacement: string): string {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return haystack.replace(new RegExp(escaped, "ig"), replacement);
}

function stamp(
  draft: Omit<GeneratedAttack, "id" | "engine" | "createdAt">,
  engine: AgentEngine,
): GeneratedAttack {
  return {
    ...draft,
    id: `rt_${crypto.randomUUID().slice(0, 8)}`,
    engine: engine.label,
    createdAt: new Date().toISOString(),
  };
}

export function listAttackFamilies() {
  return attackFamilies;
}
