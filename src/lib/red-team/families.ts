import type { MutableKey } from "@/lib/ruleset/order";

export const RED_TEAM_FAMILIES = [
  "geo-impossible-travel",
  "card-testing",
  "account-takeover",
  "synthetic-identity",
  "cnp-stolen-card",
  "low-and-slow",
  "merchant-collusion",
  "clean",
] as const;

export type RedTeamFamily = (typeof RED_TEAM_FAMILIES)[number];

export const FAMILY_CATEGORIES: Record<RedTeamFamily, MutableKey[]> = {
  "geo-impossible-travel": ["geo_device", "attack_patterns"],
  "card-testing": ["velocity_behavioral", "merchant_auth", "attack_patterns"],
  "account-takeover": ["geo_device", "merchant_auth", "attack_patterns"],
  "synthetic-identity": ["velocity_behavioral", "attack_patterns"],
  "cnp-stolen-card": ["merchant_auth", "attack_patterns"],
  "low-and-slow": ["velocity_behavioral", "thresholds", "attack_patterns"],
  "merchant-collusion": ["merchant_auth", "attack_patterns"],
  clean: ["thresholds"],
};

export const FAMILY_SPEC: Record<
  RedTeamFamily,
  { expectedFraud: boolean; description: string }
> = {
  "geo-impossible-travel": {
    expectedFraud: true,
    description:
      "Two CNP charges too far apart in too little time. Fire GEO-001 and GEO-IMPOSSIBLE-TRAVEL.",
  },
  "card-testing": {
    expectedFraud: true,
    description:
      "Burst of micro-authorizations across new merchants with declines and missing CVV.",
  },
  "account-takeover": {
    expectedFraud: true,
    description:
      "Established card, new device, IP/billing mismatch, AVS fail, spend spike.",
  },
  "synthetic-identity": {
    expectedFraud: true,
    description: "Young account, new card, near-limit spend across first-time merchants.",
  },
  "cnp-stolen-card": {
    expectedFraud: true,
    description: "CNP purchase with CVV/AVS failures on an unknown device.",
  },
  "low-and-slow": {
    expectedFraud: true,
    description: "Several mid-small purchases that sit under single-rule thresholds.",
  },
  "merchant-collusion": {
    expectedFraud: true,
    description: "Refund on a high-risk merchant after an inflated purchase.",
  },
  clean: {
    expectedFraud: false,
    description: "Routine card-present grocery charge on a known device.",
  },
};
