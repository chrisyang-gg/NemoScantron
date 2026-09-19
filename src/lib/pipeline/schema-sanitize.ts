import schema from "@/lib/data/credit-card-transaction.schema.json";

type SchemaNode = {
  type?: string | string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
};

const WRAPPER_KEYS = ["transactions", "records", "data", "items", "history"];

export type SchemaSanitizeResult = {
  ok: true;
  records: Record<string, unknown>[];
  dropped: string[];
};

export type SchemaSanitizeFailure = {
  ok: false;
  error: string;
};

const transactionSchema = schema as SchemaNode;

export function isJsonFilename(name: string): boolean {
  return name.toLowerCase().endsWith(".json");
}

export function isAllowedJsonMime(type: string | undefined): boolean {
  if (!type) return true;
  const normalized = type.toLowerCase();
  return (
    normalized === "application/json" ||
    normalized === "text/json" ||
    normalized === "application/x-json" ||
    normalized === "application/octet-stream" ||
    normalized === "text/plain"
  );
}

export function parseJsonFile(text: string):
  | { ok: true; value: unknown }
  | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "That JSON file is empty." };
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return {
      ok: false,
      error: "The file is not valid JSON. Fix it, or Clear and try another.",
    };
  }
}

/**
 * Keep only fields that exist on the credit-card schema.
 * Missing schema fields are allowed. Extra keys are dropped, never sent to the model.
 */
export function sanitizeCreditCardJson(
  parsed: unknown,
): SchemaSanitizeResult | SchemaSanitizeFailure {
  const list = asTransactionList(parsed);
  if (!list.ok) return list;

  const dropped: string[] = [];
  const records: Record<string, unknown>[] = [];

  for (let index = 0; index < list.records.length; index++) {
    const path = list.records.length === 1 ? "" : `[${index}]`;
    const projected = project(list.records[index], transactionSchema, path, dropped);
    if (isRecord(projected) && hasSchemaContent(projected)) {
      records.push(projected);
    }
  }

  if (records.length === 0) {
    return {
      ok: false,
      error:
        "That JSON does not match the credit-card transaction schema. Extra fields were removed and nothing valid was left.",
    };
  }

  return { ok: true, records, dropped };
}

export function stringifySanitizedRecords(records: Record<string, unknown>[]): string {
  if (records.length === 1) return JSON.stringify(records[0], null, 2);
  return JSON.stringify(records, null, 2);
}

function asTransactionList(
  parsed: unknown,
): { ok: true; records: unknown[] } | SchemaSanitizeFailure {
  if (Array.isArray(parsed)) {
    if (parsed.some((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
      return { ok: true, records: parsed };
    }
    if (parsed.length === 0) return { ok: true, records: [] };
    return {
      ok: false,
      error: "JSON must be a transaction object or an array of transaction objects.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: "JSON must be a transaction object or an array of transaction objects.",
    };
  }

  for (const key of WRAPPER_KEYS) {
    const nested = parsed[key];
    if (Array.isArray(nested)) return { ok: true, records: nested };
  }

  return { ok: true, records: [parsed] };
}

function project(
  value: unknown,
  node: SchemaNode,
  path: string,
  dropped: string[],
): unknown {
  if (value === undefined) return undefined;

  if (node.properties) {
    if (!isRecord(value)) return undefined;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const child = node.properties[key];
      const childPath = path ? `${path}.${key}` : key;
      if (!child) {
        dropped.push(childPath);
        continue;
      }
      const next = project(value[key], child, childPath, dropped);
      if (next !== undefined) out[key] = next;
    }
    return out;
  }

  if (isArrayNode(node)) {
    if (!Array.isArray(value)) return undefined;
    const itemSchema = node.items ?? {};
    return value.map((item, index) =>
      project(item, itemSchema, `${path}[${index}]`, dropped),
    );
  }

  return value;
}

function isArrayNode(node: SchemaNode): boolean {
  const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
  return Boolean(node.items) || types.includes("array");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSchemaContent(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some(hasSchemaContent);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasSchemaContent);
  }
  return true;
}
