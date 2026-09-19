/** Gold labels stay on disk for Claude. The scoring Nemotron never sees them. */
export function stripGoldForScoring(record: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...record };
  delete next.label;
  next.source = "real";
  next.risk_assessment = {
    model_risk_score: 0,
    decision: "approve",
    rules_triggered: [],
  };
  return next;
}

export function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const card = asRecord(record.card);
  const account = asRecord(record.account);
  const merchant = asRecord(record.merchant);
  const location = asRecord(record.location);
  const auth = asRecord(record.authentication);
  const velocity = asRecord(record.velocity_features);
  return {
    transaction_id: record.transaction_id,
    amount: record.amount,
    channel: record.channel,
    merchant_country: merchant.merchant_country,
    merchant_risk_score: merchant.merchant_risk_score,
    first_time_merchant: merchant.is_first_time_merchant_for_cardholder,
    distance_km: location.distance_from_last_transaction_km,
    minutes_since_last: location.time_since_last_transaction_minutes,
    ip_country: location.ip_country,
    known_device: location.is_known_device_for_account,
    cvv: auth.cvv_result,
    avs: auth.avs_result,
    txn_1h: velocity.transactions_last_1h,
    declined_1h: velocity.declined_attempts_last_1h,
    avg_90d: velocity.avg_transaction_amount_90d,
    card_age_days: card.card_activated_days_ago,
    account_open: account.account_open_date,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
