/** Compact field list for red-team generation. Do not send the full schema. */
export const SCHEMA_BRIEF = `One CreditCardTransaction object. Extra keys are dropped.
transaction_id string
timestamp ISO-8601 UTC
amount number
currency ISO-4217
transaction_type purchase|refund|cash_advance|atm_withdrawal|balance_transfer|recurring_payment|chargeback
channel card_present|card_not_present|online|mobile_app|phone_order|mail_order
entry_mode chip|magstripe|contactless_tap|manual_key_entry|online_keyed|recurring_stored_credential
card: card_id_token, bin(6), last_four(4), network Visa|Mastercard|American Express|Discover, card_type credit|debit|prepaid, product_tier, issuing_bank, expiration_month, expiration_year, card_present, card_activated_days_ago, is_virtual_card
account: account_id_token, account_open_date, credit_limit, available_credit, current_balance, account_status active|suspended|closed|delinquent, billing_zip, billing_country, risk_tier low|medium|high
merchant: merchant_id_token, merchant_name, mcc_code(4), merchant_category, merchant_city, merchant_state, merchant_country, acquirer_id_token, merchant_risk_score 0-1, is_first_time_merchant_for_cardholder
location: transaction_city, transaction_state, transaction_country, latitude, longitude, distance_from_home_km, distance_from_last_transaction_km, time_since_last_transaction_minutes, ip_address_hash, ip_country, device_id_token, device_type mobile|desktop|tablet|pos_terminal|atm, is_known_device_for_account
authentication: cvv_result match|no_match|not_provided, avs_result full_match|partial_match|no_match|not_checked, pin_verified, three_ds_authenticated, otp_verified, biometric_verified
velocity_features: transactions_last_1h, transactions_last_24h, amount_sum_last_24h, distinct_merchants_last_24h, distinct_countries_last_24h, avg_transaction_amount_90d, std_transaction_amount_90d, declined_attempts_last_1h
processing: authorization_code_token, response_code approved|declined_insufficient_funds|declined_suspected_fraud|declined_invalid_card|declined_expired_card|referral, processor, processing_time_ms, network_transaction_id_token
risk_assessment: model_risk_score, rules_triggered[], decision approve|flag_for_review|hold|decline
label: is_fraud, fraud_type, confirmed_by red_team, chargeback_filed
source: red_team_synthetic`;

export const GENERATION_SLOTS = [
  { family: "geo-impossible-travel", difficulty: "hard" },
  { family: "card-testing", difficulty: "edge" },
  { family: "account-takeover", difficulty: "rare" },
  { family: "synthetic-identity", difficulty: "hard" },
  { family: "cnp-stolen-card", difficulty: "edge" },
  { family: "low-and-slow", difficulty: "rare" },
  { family: "merchant-collusion", difficulty: "hard" },
  { family: "clean", difficulty: "lookalike" },
  { family: "geo-impossible-travel", difficulty: "rare" },
  { family: "card-testing", difficulty: "hard" },
] as const;
