import type {
  FraudIndicator,
  NemotronAnalysis,
  NemotronDecision,
  RulesetVersions,
} from "@/lib/nemotron/types";

const HIGH_RISK_COUNTRIES = new Set([
  "NG",
  "KE",
  "RO",
  "BG",
  "PK",
  "BD",
  "VN",
  "ID",
  "BR",
  "CO",
  "PH",
  "UA",
  "BY",
]);

const HIGH_RISK_MCC = new Set([
  "7995",
  "6051",
  "5912",
  "4829",
  "6211",
  "9754",
  "5999",
  "4900",
  "7372",
]);

const CNP = new Set(["card_not_present", "online", "phone_order", "mail_order"]);

export const DEFAULT_VERSIONS: RulesetVersions = {
  velocity_behavioral: "v1.0",
  geo_device: "v1.0",
  merchant_auth: "v1.0",
  attack_patterns: "v1.0",
  thresholds: "v1.0",
};

type Fired = {
  id: string;
  score: number;
  severity: FraudIndicator["severity"];
  detail: string;
  section: "velocity_behavioral" | "geo_device" | "merchant_auth";
  escalate?: boolean;
};

export function localAnalyze(
  record: Record<string, unknown>,
  userContext?: string | null,
  versions: RulesetVersions = DEFAULT_VERSIONS,
): NemotronAnalysis {
  const fired: Fired[] = [];
  const card = rec(record.card);
  const account = rec(record.account);
  const merchant = rec(record.merchant);
  const location = rec(record.location);
  const auth = rec(record.authentication);
  const velocityFeat = rec(record.velocity_features);
  const amount = num(record.amount);
  const channel = str(record.channel);
  const entry = str(record.entry_mode);
  const type = str(record.transaction_type);
  const timestamp = str(record.timestamp) || new Date().toISOString();

  const tx1h = num(velocityFeat.transactions_last_1h);
  const sum24 = num(velocityFeat.amount_sum_last_24h);
  const merchants24 = num(velocityFeat.distinct_merchants_last_24h);
  const countries24 = num(velocityFeat.distinct_countries_last_24h);
  const declined1h = num(velocityFeat.declined_attempts_last_1h);
  const avg90 = num(velocityFeat.avg_transaction_amount_90d);
  const std90 = num(velocityFeat.std_transaction_amount_90d);
  const tx24 = num(velocityFeat.transactions_last_24h);
  const activated = int(card.card_activated_days_ago, 9999);
  const accountDays = daysSince(str(account.account_open_date), timestamp);
  const distanceLast = num(location.distance_from_last_transaction_km);
  const minutesLast = num(location.time_since_last_transaction_minutes, 1);
  const speed = distanceLast / Math.max(minutesLast, 1);
  const ipCountry = str(location.ip_country);
  const billCountry = str(account.billing_country);
  const txCountry = str(location.transaction_country) || str(merchant.merchant_country);
  const merchantCountry = str(merchant.merchant_country);
  const knownDevice = location.is_known_device_for_account;
  const merchantRisk = num(merchant.merchant_risk_score);
  const firstMerchant = merchant.is_first_time_merchant_for_cardholder === true;
  const cvv = str(auth.cvv_result);
  const avs = str(auth.avs_result);
  const threeDs = auth.three_ds_authenticated === true;
  const status = str(account.account_status);
  const creditLimit = num(account.credit_limit);
  const currentBalance = num(account.current_balance);

  if (tx1h >= 5) {
    fired.push({
      id: "VB-001",
      score: Math.min(1, 0.4 + 0.1 * Math.max(0, tx1h - 5)),
      severity: "high",
      detail: `${tx1h} transactions in the last hour.`,
      section: "velocity_behavioral",
    });
  }
  if (std90 > 0 && amount > avg90 + 3 * std90) {
    fired.push({
      id: "VB-002",
      score: CNP.has(channel) ? 0.4 : 0.3,
      severity: "medium",
      detail: `Amount ${amount} is a 3σ outlier versus the 90-day baseline.`,
      section: "velocity_behavioral",
    });
  }
  if (sum24 > 1500) {
    fired.push({
      id: "VB-003",
      score: 0.25,
      severity: "medium",
      detail: `24h spend of ${sum24} exceeds the $1,500 ceiling.`,
      section: "velocity_behavioral",
    });
  }
  if (merchants24 >= 6) {
    fired.push({
      id: "VB-004",
      score: 0.2,
      severity: "medium",
      detail: `${merchants24} distinct merchants in 24 hours.`,
      section: "velocity_behavioral",
    });
  }
  if (declined1h >= 2) {
    fired.push({
      id: "VB-005",
      score: Math.min(1, 0.35 + 0.05 * Math.max(0, declined1h - 2)),
      severity: "high",
      detail: `${declined1h} declined attempts in the last hour.`,
      section: "velocity_behavioral",
    });
  }
  if (activated <= 30) {
    fired.push({
      id: "VB-006",
      score: 0.15,
      severity: "low",
      detail: `Card activated ${activated} days ago.`,
      section: "velocity_behavioral",
    });
  }
  if (accountDays <= 60) {
    fired.push({
      id: "VB-007",
      score: 0.2,
      severity: "medium",
      detail: `Account opened ${accountDays} days before this transaction.`,
      section: "velocity_behavioral",
    });
  }
  if (countries24 >= 2) {
    fired.push({
      id: "VB-008",
      score: Math.min(1, 0.3 + 0.05 * Math.max(0, countries24 - 2)),
      severity: "high",
      detail: `${countries24} countries in the last 24 hours.`,
      section: "velocity_behavioral",
    });
  }

  let holdOverride = false;
  if (speed > 10 || (distanceLast > 0 && minutesLast === 0)) {
    fired.push({
      id: "GEO-001",
      score: 0.8,
      severity: "critical",
      detail: `Implied speed of ${(speed * 60).toFixed(0)} km/h over ${distanceLast} km.`,
      section: "geo_device",
      escalate: true,
    });
    if (speed * 60 > 900) holdOverride = true;
  }
  if (merchantCountry && HIGH_RISK_COUNTRIES.has(merchantCountry)) {
    fired.push({
      id: "GEO-002",
      score: 0.4,
      severity: "high",
      detail: `First-use high-risk merchant country ${merchantCountry}.`,
      section: "geo_device",
    });
  }
  if (ipCountry && billCountry && ipCountry !== billCountry) {
    fired.push({
      id: "GEO-003",
      score: 0.25,
      severity: "medium",
      detail: `IP country ${ipCountry} does not match billing ${billCountry}.`,
      section: "geo_device",
    });
  }
  if (ipCountry && txCountry && ipCountry !== txCountry) {
    fired.push({
      id: "GEO-004",
      score: 0.3,
      severity: "medium",
      detail: `IP country ${ipCountry} does not match transaction ${txCountry}.`,
      section: "geo_device",
    });
  }
  if (num(location.distance_from_home_km) > 500 && CNP.has(channel)) {
    fired.push({
      id: "GEO-005",
      score: 0.2,
      severity: "medium",
      detail: `CNP charge ${num(location.distance_from_home_km)} km from home.`,
      section: "geo_device",
    });
  }
  if (knownDevice === false) {
    fired.push({
      id: "GEO-006",
      score: 0.25,
      severity: "medium",
      detail: "Device is not known for this account.",
      section: "geo_device",
    });
  }

  if (merchantRisk >= 0.5) {
    fired.push({
      id: "MA-001",
      score: merchantRisk >= 0.75 ? 0.45 : 0.3,
      severity: merchantRisk >= 0.75 ? "high" : "medium",
      detail: `Merchant risk score ${merchantRisk}.`,
      section: "merchant_auth",
    });
  }
  if (firstMerchant) {
    fired.push({
      id: "MA-002",
      score: 0.1,
      severity: "low",
      detail: "First-time merchant for this cardholder.",
      section: "merchant_auth",
    });
  }
  if (HIGH_RISK_MCC.has(str(merchant.mcc_code))) {
    fired.push({
      id: "MA-003",
      score: 0.25,
      severity: "medium",
      detail: `High-risk MCC ${str(merchant.mcc_code)}.`,
      section: "merchant_auth",
    });
  }
  if (type === "refund" && merchantRisk >= 0.35) {
    fired.push({
      id: "MA-004",
      score: 0.35,
      severity: "high",
      detail: "Refund on a moderate-to-high-risk merchant.",
      section: "merchant_auth",
      escalate: true,
    });
  }
  if (cvv === "no_match") {
    fired.push({
      id: "MA-005",
      score: 0.4,
      severity: "high",
      detail: "CVV did not match.",
      section: "merchant_auth",
    });
  }
  if (cvv === "not_provided" && (channel === "card_not_present" || channel === "online")) {
    fired.push({
      id: "MA-006",
      score: 0.2,
      severity: "medium",
      detail: "CVV not provided on a CNP channel.",
      section: "merchant_auth",
    });
  }
  if (avs === "no_match") {
    fired.push({
      id: "MA-007",
      score: 0.25,
      severity: "medium",
      detail: "AVS full mismatch.",
      section: "merchant_auth",
    });
  }
  if (!threeDs && amount >= 200 && (channel === "online" || channel === "card_not_present")) {
    fired.push({
      id: "MA-008",
      score: 0.2,
      severity: "medium",
      detail: `3-D Secure missing on a ${amount} online charge.`,
      section: "merchant_auth",
    });
  }
  if (entry === "manual_key_entry") {
    fired.push({
      id: "MA-009",
      score: 0.2,
      severity: "medium",
      detail: "Manual key entry at the terminal.",
      section: "merchant_auth",
    });
  }
  if ((type === "cash_advance" || type === "atm_withdrawal") && accountDays <= 90) {
    fired.push({
      id: "MA-010",
      score: 0.35,
      severity: "high",
      detail: `${type} on an account ${accountDays} days old.`,
      section: "merchant_auth",
    });
  }

  const ids = new Set(fired.map((item) => item.id));
  const patterns: { id: string; boost: number; escalate?: boolean }[] = [];

  const cardTestingSignals = [
    tx1h >= 5,
    amount <= 5,
    declined1h >= 2,
    firstMerchant,
    cvv === "no_match" || cvv === "not_provided",
    merchants24 >= 4,
  ].filter(Boolean).length;
  if (cardTestingSignals >= 3) patterns.push({ id: "CARD-TESTING", boost: 0.3 });

  if (ids.has("GEO-001") && distanceLast > 500 && CNP.has(channel)) {
    patterns.push({ id: "GEO-IMPOSSIBLE-TRAVEL", boost: 0.25 });
  }

  const takeoverSignals = [
    knownDevice === false,
    Boolean(ipCountry && billCountry && ipCountry !== billCountry),
    avs === "no_match",
    activated > 180 && avg90 > 0 && amount > avg90 * 2,
    declined1h >= 1,
  ].filter(Boolean).length;
  if (takeoverSignals >= 3) {
    patterns.push({ id: "ACCOUNT-TAKEOVER", boost: 0.35, escalate: true });
  }

  const syntheticSignals = [
    accountDays <= 60,
    activated <= 45,
    creditLimit > 0 && currentBalance / creditLimit > 0.8,
    merchants24 >= 5,
    avs === "no_match" || avs === "partial_match",
    firstMerchant,
  ].filter(Boolean).length;
  if (syntheticSignals >= 3) patterns.push({ id: "SYNTHETIC-IDENTITY", boost: 0.3 });

  const highOrCritical = fired.some(
    (item) =>
      (item.section === "velocity_behavioral" || item.section === "geo_device") &&
      (item.severity === "high" || item.severity === "critical"),
  );
  if (
    amount >= 10 &&
    amount <= 75 &&
    tx24 >= 4 &&
    tx24 > 0 &&
    sum24 / tx24 < 80 &&
    !highOrCritical
  ) {
    patterns.push({ id: "LOW-AND-SLOW", boost: 0.2 });
  }

  const collusionSignals = [
    ids.has("MA-004"),
    merchantRisk >= 0.5,
    type === "refund" || type === "chargeback",
    avg90 > 0 && amount > avg90 * 1.5,
  ].filter(Boolean).length;
  if (collusionSignals >= 2) {
    patterns.push({ id: "MERCHANT-COLLUSION", boost: 0.35, escalate: true });
  }

  const stolenSignals = [
    CNP.has(channel),
    cvv === "no_match",
    avs === "no_match" || avs === "partial_match",
    knownDevice === false,
    firstMerchant,
    amount > 100,
  ].filter(Boolean).length;
  if (stolenSignals >= 3) patterns.push({ id: "CNP-STOLEN-CARD", boost: 0.2 });

  const velocityScore = clamp(sumSection(fired, "velocity_behavioral"));
  const geo = clamp(sumSection(fired, "geo_device"));
  const merchantAuth = clamp(sumSection(fired, "merchant_auth"));
  const accountBoost = ids.has("VB-007") ? 0.15 : ids.has("VB-006") ? 0.1 : 0;
  const patternBoost = patterns.reduce((max, item) => Math.max(max, item.boost), 0);
  const composite = clamp(
    velocityScore * 0.25 + geo * 0.35 + merchantAuth * 0.3 + accountBoost * 0.1 + patternBoost,
  );

  let decision = decisionFor(composite);
  if (status === "suspended" || status === "delinquent") decision = raise(decision, "hold");
  if (holdOverride) decision = raise(decision, "hold");
  if (patterns.some((item) => item.id === "ACCOUNT-TAKEOVER")) decision = raise(decision, "hold");
  if (ids.has("MA-005") && ids.has("MA-007")) decision = raise(decision, "flag_for_review");

  const note = userContext?.trim() ?? "";
  if (/\b(decline|block|hold|escalate)\b/i.test(note)) {
    if (/decline|block/i.test(note)) decision = raise(decision, "decline");
    else if (/hold/i.test(note)) decision = raise(decision, "hold");
    else decision = raise(decision, "flag_for_review");
  }

  const escalate =
    decision === "flag_for_review" ||
    decision === "hold" ||
    (decision === "decline" &&
      (fired.some((item) => item.escalate) || patterns.some((item) => item.escalate)));

  const missing = countMissing(velocityFeat, location, auth);
  const confidence = clamp(Math.max(0.4, 1 - missing * 0.04));

  const indicators: FraudIndicator[] = fired.map((item) => ({
    indicator: item.id.toLowerCase().replace("-", "_"),
    severity: item.severity,
    detail: item.detail,
  }));
  for (const pattern of patterns) {
    indicators.push({
      indicator: pattern.id.toLowerCase(),
      severity: "critical",
      detail: `Matched attack pattern ${pattern.id}.`,
    });
  }
  if (decision !== "approve" && indicators.length === 0) {
    indicators.push({
      indicator: "composite_risk",
      severity: "medium",
      detail: "Composite score crossed a review threshold.",
    });
  }

  const twoFields = `amount ${amount} and channel ${channel || "unknown"}`;
  const ruleCite = fired[0]?.id ?? patterns[0]?.id ?? "no fired rule";
  const reasoning = [
    `The record shows ${twoFields}, with ${fired.length} rule(s) firing including ${ruleCite}.`,
    patterns.length
      ? `Pattern ${patterns[0].id} added a ${patterns[0].boost.toFixed(3)} boost.`
      : "No multi-signal attack pattern crossed its threshold.",
    confidence < 0.7
      ? `Confidence is ${confidence.toFixed(3)} because ${missing} optional fields are missing.`
      : `Confidence is ${confidence.toFixed(3)} on the fields present.`,
  ].join(" ");

  return {
    transaction_id: str(record.transaction_id) || "unknown",
    analysis_timestamp: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    risk_score: composite,
    decision,
    confidence,
    rules_triggered: fired.map((item) => item.id),
    patterns_matched: patterns.map((item) => item.id),
    fraud_indicators: indicators,
    risk_score_breakdown: {
      velocity_behavioral: velocityScore,
      geo_device: geo,
      merchant_auth: merchantAuth,
      pattern_boost: patternBoost,
    },
    reasoning,
    recommended_action: actionFor(decision, txCountry || merchantCountry),
    escalate_to_analyst: escalate,
    ruleset_versions_applied: versions,
  };
}

function decisionFor(score: number): NemotronDecision {
  if (score < 0.2) return "approve";
  if (score < 0.5) return "flag_for_review";
  if (score < 0.75) return "hold";
  return "decline";
}

function raise(current: NemotronDecision, floor: NemotronDecision): NemotronDecision {
  const rank = { approve: 0, flag_for_review: 1, hold: 2, decline: 3 };
  return rank[current] >= rank[floor] ? current : floor;
}

function actionFor(decision: NemotronDecision, place: string): string {
  if (decision === "approve") return "Approve — no action required.";
  if (decision === "flag_for_review") {
    return `Queue this authorization for analyst review before releasing funds${place ? ` related to ${place}` : ""}.`;
  }
  if (decision === "hold") {
    return `Place a temporary hold and contact the cardholder at the phone number on file to verify the ${place || "remote"} charge.`;
  }
  return `Decline authorization, block the card, and open a chargeback review on the ${place || "flagged"} activity.`;
}

function sumSection(fired: Fired[], section: Fired["section"]): number {
  return fired.filter((item) => item.section === section).reduce((sum, item) => sum + item.score, 0);
}

function countMissing(
  velocity: Record<string, unknown>,
  location: Record<string, unknown>,
  auth: Record<string, unknown>,
): number {
  const keys = [
    ...["transactions_last_1h", "amount_sum_last_24h", "distinct_merchants_last_24h", "avg_transaction_amount_90d", "std_transaction_amount_90d", "declined_attempts_last_1h"],
    ...["distance_from_last_transaction_km", "time_since_last_transaction_minutes", "ip_country", "is_known_device_for_account"],
    ...["cvv_result", "avs_result", "three_ds_authenticated"],
  ];
  const bag = { ...velocity, ...location, ...auth };
  return keys.filter((key) => bag[key] === undefined || bag[key] === null || bag[key] === "").length;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function int(value: unknown, fallback = 0): number {
  return Math.trunc(num(value, fallback));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function daysSince(openDate: string, timestamp: string): number {
  if (!openDate) return 9999;
  const open = Date.parse(openDate);
  const now = Date.parse(timestamp) || Date.now();
  if (!Number.isFinite(open)) return 9999;
  return Math.max(0, Math.round((now - open) / 86_400_000));
}
