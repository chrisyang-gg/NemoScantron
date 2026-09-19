import type { Verdict } from "@/lib/pipeline/types";

export type AttackFamilyId =
  | "evade"
  | "lookalike-vendor"
  | "authority"
  | "refund-mule"
  | "clean";

export type AttackFamily = {
  id: AttackFamilyId;
  name: string;
  expectedVerdict: Verdict;
  goal: string;
};

export const attackFamilies: AttackFamily[] = [
  {
    id: "evade",
    name: "Evade the current pack",
    expectedVerdict: "fraud",
    goal: "Read the live ruleset and write a fraud case that avoids every active signal. This is the default adversary.",
  },
  {
    id: "lookalike-vendor",
    name: "Lookalike vendor",
    expectedVerdict: "fraud",
    goal: "Pay a mule using a one-letter vendor mismatch and a brand-new destination, without using words the current pack already scores.",
  },
  {
    id: "authority",
    name: "Authority fraud, no keywords",
    expectedVerdict: "fraud",
    goal: "Impersonate a senior operator asking for a same-day remittance without CEO/urgent/wire phrasing.",
  },
  {
    id: "refund-mule",
    name: "Refund to a stranger rail",
    expectedVerdict: "fraud",
    goal: "Redirect a customer refund onto a card or account the original payer never used.",
  },
  {
    id: "clean",
    name: "Clean control",
    expectedVerdict: "clear",
    goal: "Ordinary payroll or AP that should stay clear. Used to catch a ruleset that got too hungry.",
  },
];

export function getAttackFamily(id: string | undefined): AttackFamily {
  return attackFamilies.find((family) => family.id === id) ?? attackFamilies[0];
}
