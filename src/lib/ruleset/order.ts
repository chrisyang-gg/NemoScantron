export const ASSEMBLY_ORDER = [
  "01_CORE_identity.txt",
  "02_CORE_execution_workflow.txt",
  "03_RULES_velocity_behavioral.txt",
  "04_RULES_geo_device.txt",
  "05_RULES_merchant_auth.txt",
  "06_RULES_attack_patterns.txt",
  "07_RULES_thresholds.txt",
  "08_CORE_output_format.txt",
] as const;

export const IMMUTABLE_FILES = [
  "01_CORE_identity.txt",
  "02_CORE_execution_workflow.txt",
  "08_CORE_output_format.txt",
] as const;

export const MUTABLE_FILES = [
  "03_RULES_velocity_behavioral.txt",
  "04_RULES_geo_device.txt",
  "05_RULES_merchant_auth.txt",
  "06_RULES_attack_patterns.txt",
  "07_RULES_thresholds.txt",
] as const;

export const MUTABLE_KEYS = [
  "velocity_behavioral",
  "geo_device",
  "merchant_auth",
  "attack_patterns",
  "thresholds",
] as const;

export type MutableKey = (typeof MUTABLE_KEYS)[number];

export const MUTABLE_FILE_BY_KEY: Record<MutableKey, (typeof MUTABLE_FILES)[number]> = {
  velocity_behavioral: "03_RULES_velocity_behavioral.txt",
  geo_device: "04_RULES_geo_device.txt",
  merchant_auth: "05_RULES_merchant_auth.txt",
  attack_patterns: "06_RULES_attack_patterns.txt",
  thresholds: "07_RULES_thresholds.txt",
};
