import { FAMILY_SPEC, RED_TEAM_FAMILIES, type RedTeamFamily } from "@/lib/red-team/families";

export type GeneratedCase = {
  family: RedTeamFamily;
  expectedFraud: boolean;
  description: string;
  record: Record<string, unknown>;
};

export function generateFraudCase(family?: string): GeneratedCase {
  const id = isFamily(family)
    ? family
    : RED_TEAM_FAMILIES[Math.floor(Math.random() * (RED_TEAM_FAMILIES.length - 1))];
  const spec = FAMILY_SPEC[id];
  return {
    family: id,
    expectedFraud: spec.expectedFraud,
    description: spec.description,
    record: buildRecord(id),
  };
}

export function generateFraudBatch(count = 4): GeneratedCase[] {
  const families = RED_TEAM_FAMILIES.filter((item) => item !== "clean");
  return Array.from({ length: count }, (_, index) =>
    generateFraudCase(families[index % families.length]),
  );
}

function isFamily(value: string | undefined): value is RedTeamFamily {
  return Boolean(value && (RED_TEAM_FAMILIES as readonly string[]).includes(value));
}

function buildRecord(family: RedTeamFamily): Record<string, unknown> {
  const stamp = crypto.randomUUID().slice(0, 8);
  const now = "2026-09-19T18:40:00Z";
  const base = {
    transaction_id: `txn_rt_${stamp}`,
    timestamp: now,
    amount: 42.5,
    currency: "USD",
    transaction_type: "purchase",
    channel: "online",
    entry_mode: "online_keyed",
    card: {
      card_id_token: `card_${stamp}`,
      bin: "414720",
      last_four: "2211",
      network: "Visa",
      card_type: "credit",
      product_tier: "gold",
      issuing_bank: "Harborline",
      expiration_month: 8,
      expiration_year: 2028,
      card_present: false,
      card_activated_days_ago: 400,
      is_virtual_card: false,
    },
    account: {
      account_id_token: `acct_${stamp}`,
      account_open_date: "2022-04-11",
      credit_limit: 8000,
      available_credit: 5400,
      current_balance: 2600,
      account_status: "active",
      billing_zip: "10001",
      billing_country: "US",
      risk_tier: "low",
    },
    merchant: {
      merchant_id_token: `merch_${stamp}`,
      merchant_name: "Northline Market",
      mcc_code: "5411",
      merchant_category: "grocery",
      merchant_city: "Lagos",
      merchant_country: "NG",
      merchant_risk_score: 0.22,
      is_first_time_merchant_for_cardholder: true,
    },
    location: {
      transaction_city: "Lagos",
      transaction_country: "NG",
      distance_from_home_km: 8412,
      distance_from_last_transaction_km: 8412,
      time_since_last_transaction_minutes: 40,
      ip_country: "NG",
      device_id_token: `dev_${stamp}`,
      device_type: "desktop",
      is_known_device_for_account: false,
    },
    authentication: {
      cvv_result: "match",
      avs_result: "partial_match",
      three_ds_authenticated: false,
    },
    velocity_features: {
      transactions_last_1h: 1,
      transactions_last_24h: 2,
      amount_sum_last_24h: 90,
      distinct_merchants_last_24h: 2,
      distinct_countries_last_24h: 2,
      avg_transaction_amount_90d: 48,
      std_transaction_amount_90d: 12,
      declined_attempts_last_1h: 0,
    },
    processing: { response_code: "approved" },
    risk_assessment: { model_risk_score: 0, decision: "approve" },
    label: {
      is_fraud: FAMILY_SPEC[family].expectedFraud,
      fraud_type: family,
      confirmed_by: "red_team",
      chargeback_filed: false,
    },
    source: "red_team_synthetic",
  };

  if (family === "card-testing") {
    return merge(base, {
      amount: 3.12,
      merchant: { merchant_country: "US", merchant_city: "Austin", mcc_code: "7372" },
      location: {
        transaction_country: "US",
        transaction_city: "Austin",
        distance_from_last_transaction_km: 12,
        time_since_last_transaction_minutes: 8,
        ip_country: "US",
        distance_from_home_km: 18,
      },
      authentication: { cvv_result: "not_provided", avs_result: "no_match" },
      velocity_features: {
        transactions_last_1h: 7,
        transactions_last_24h: 9,
        amount_sum_last_24h: 28,
        distinct_merchants_last_24h: 6,
        distinct_countries_last_24h: 1,
        declined_attempts_last_1h: 3,
      },
    });
  }

  if (family === "account-takeover") {
    return merge(base, {
      amount: 1860,
      merchant: { merchant_country: "RO", merchant_city: "Bucharest", mcc_code: "5999", merchant_risk_score: 0.61 },
      location: {
        transaction_country: "RO",
        transaction_city: "Bucharest",
        ip_country: "RO",
        distance_from_last_transaction_km: 7200,
        time_since_last_transaction_minutes: 180,
      },
      authentication: { cvv_result: "match", avs_result: "no_match" },
      velocity_features: {
        avg_transaction_amount_90d: 62,
        std_transaction_amount_90d: 14,
        declined_attempts_last_1h: 1,
        distinct_countries_last_24h: 2,
      },
    });
  }

  if (family === "synthetic-identity") {
    return merge(base, {
      amount: 940,
      card: { card_activated_days_ago: 12 },
      account: {
        account_open_date: "2026-08-02",
        credit_limit: 1500,
        current_balance: 1320,
        available_credit: 180,
        risk_tier: "high",
      },
      merchant: { merchant_country: "US", merchant_city: "Miami", mcc_code: "6051", merchant_risk_score: 0.44 },
      location: {
        transaction_country: "US",
        transaction_city: "Miami",
        ip_country: "US",
        distance_from_last_transaction_km: 8,
        time_since_last_transaction_minutes: 25,
        distance_from_home_km: 14,
      },
      authentication: { avs_result: "no_match" },
      velocity_features: {
        distinct_merchants_last_24h: 6,
        amount_sum_last_24h: 1280,
        transactions_last_24h: 6,
        distinct_countries_last_24h: 1,
      },
    });
  }

  if (family === "cnp-stolen-card") {
    return merge(base, {
      amount: 428,
      merchant: { merchant_country: "US", merchant_city: "Seattle", mcc_code: "7372" },
      location: {
        transaction_country: "US",
        transaction_city: "Seattle",
        ip_country: "NL",
        distance_from_home_km: 620,
        distance_from_last_transaction_km: 40,
        time_since_last_transaction_minutes: 200,
      },
      authentication: { cvv_result: "no_match", avs_result: "no_match" },
    });
  }

  if (family === "low-and-slow") {
    return merge(base, {
      amount: 41.2,
      channel: "online",
      merchant: { merchant_country: "US", merchant_city: "Denver", merchant_risk_score: 0.18, is_first_time_merchant_for_cardholder: false },
      location: {
        transaction_country: "US",
        transaction_city: "Denver",
        ip_country: "US",
        is_known_device_for_account: true,
        distance_from_home_km: 11,
        distance_from_last_transaction_km: 4,
        time_since_last_transaction_minutes: 90,
      },
      authentication: { cvv_result: "match", avs_result: "full_match", three_ds_authenticated: true },
      velocity_features: {
        transactions_last_1h: 1,
        transactions_last_24h: 5,
        amount_sum_last_24h: 188,
        distinct_merchants_last_24h: 3,
        distinct_countries_last_24h: 1,
        declined_attempts_last_1h: 0,
        avg_transaction_amount_90d: 46,
        std_transaction_amount_90d: 9,
      },
    });
  }

  if (family === "merchant-collusion") {
    return merge(base, {
      amount: 2100,
      transaction_type: "refund",
      merchant: {
        merchant_country: "US",
        merchant_city: "Houston",
        mcc_code: "5999",
        merchant_risk_score: 0.72,
      },
      location: {
        transaction_country: "US",
        ip_country: "US",
        distance_from_last_transaction_km: 6,
        time_since_last_transaction_minutes: 30,
        is_known_device_for_account: true,
      },
      velocity_features: {
        avg_transaction_amount_90d: 80,
        distinct_merchants_last_24h: 3,
        distinct_countries_last_24h: 1,
      },
    });
  }

  if (family === "clean") {
    return merge(base, {
      amount: 38.4,
      channel: "card_present",
      entry_mode: "chip",
      card: { card_present: true },
      merchant: {
        merchant_name: "Neighborhood Grocer",
        merchant_city: "New York",
        merchant_country: "US",
        mcc_code: "5411",
        merchant_risk_score: 0.08,
        is_first_time_merchant_for_cardholder: false,
      },
      location: {
        transaction_city: "New York",
        transaction_country: "US",
        ip_country: "US",
        distance_from_home_km: 3,
        distance_from_last_transaction_km: 2,
        time_since_last_transaction_minutes: 1400,
        is_known_device_for_account: true,
        device_type: "pos_terminal",
      },
      authentication: { cvv_result: "match", avs_result: "full_match", three_ds_authenticated: true },
      velocity_features: {
        transactions_last_1h: 1,
        transactions_last_24h: 2,
        amount_sum_last_24h: 61,
        distinct_merchants_last_24h: 2,
        distinct_countries_last_24h: 1,
        declined_attempts_last_1h: 0,
      },
    });
  }

  return base;
}

function merge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value) && isRecord(out[key])) {
      out[key] = { ...(out[key] as Record<string, unknown>), ...value };
    } else {
      out[key] = value;
    }
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
