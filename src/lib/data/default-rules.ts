import type { Rule, WorkflowPack } from "@/lib/pipeline/types";

export const defaultWorkflow: WorkflowPack = {
  name: "Nemo fraud dispatch",
  description:
    "Sanitize intake, score against the policy pack, reason with Nemotron, then let Nemo dispatch hold / notify / close. An AI red team writes fake fraud; an AI feedback agent trains the ruleset from misses.",
  steps: [
    "Sanitize website or AI red-team payload",
    "Evaluate ruleset, policies, and this workflow description",
    "Nemotron reasoning over evidence",
    "Nemo dispatches execution actions",
    "Write metrics back to the website",
    "AI feedback proposes a rule when the adversary and Nemotron disagree",
  ],
};

export const defaultRules: Rule[] = [
  {
    id: "ceo-urgency-wire",
    title: "Executive urgency + outbound wire",
    policy:
      "POL-WIRE-04: Treat executive-requested payment changes as high risk until verified out of band.",
    signals: ["ceo", "cfo", "urgent", "immediately", "wire", "transfer", "today"],
    minHits: 3,
    severity: "block",
    enabled: true,
    owner: "policy",
  },
  {
    id: "payment-channel-shift",
    title: "Last-minute payment channel change",
    policy:
      "POL-BEC-11: Invoice or vendor payment destination changes require dual control.",
    signals: [
      "new account",
      "updated banking",
      "routing",
      "do not use the old",
      "wire instead",
      "send to this account",
    ],
    minHits: 2,
    severity: "block",
    enabled: true,
    owner: "policy",
  },
  {
    id: "gift-card-or-crypto",
    title: "Irreversible rail (gift card / crypto)",
    policy:
      "POL-RAIL-02: Gift cards, crypto, and cash-like rails are never an approved vendor payment method.",
    signals: [
      "gift card",
      "google play",
      "steam card",
      "bitcoin",
      "usdt",
      "crypto wallet",
      "wallet address",
    ],
    minHits: 1,
    severity: "block",
    enabled: true,
    owner: "policy",
  },
  {
    id: "secrecy-pressure",
    title: "Secrecy or isolation pressure",
    policy:
      "POL-SOCENG-07: Requests to skip finance, legal, or the usual approver are social engineering.",
    signals: [
      "keep this confidential",
      "don't tell",
      "do not tell",
      "between us",
      "handle personally",
      "skip the usual",
      "off the record",
    ],
    minHits: 1,
    severity: "flag",
    enabled: true,
    owner: "policy",
  },
  {
    id: "invoice-reuse",
    title: "Invoice number reuse or duplicate claim",
    policy:
      "POL-DUP-03: Repeated invoice numbers or 'resubmitted' claims need a duplicate-payment check.",
    signals: ["invoice #", "same invoice", "resubmit", "already paid", "duplicate"],
    minHits: 2,
    severity: "flag",
    enabled: true,
    owner: "execution",
  },
  {
    id: "after-hours-international",
    title: "After-hours international movement",
    policy:
      "POL-GEO-09: Large international transfers requested outside business hours get a watch flag.",
    signals: [
      "nigeria",
      "offshore",
      "hong kong",
      "after hours",
      "sunday",
      "midnight",
      "swift",
    ],
    minHits: 2,
    severity: "watch",
    enabled: true,
    owner: "execution",
  },
];
