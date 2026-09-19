const DEFAULT_MODEL = "claude-sonnet-4-5";
const DEFAULT_BASE = "https://api.anthropic.com";

export function claudeStatus() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const base = (process.env.ANTHROPIC_API_BASE?.trim() || DEFAULT_BASE).replace(/\/$/, "");
  return {
    live: Boolean(key),
    model,
    base,
    label: key ? model : "claude (missing ANTHROPIC_API_KEY)",
  };
}

export async function callClaude(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const status = claudeStatus();
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY is missing. Add it to .env to let Claude patch RULES files 3–7.",
    };
  }

  const response = await fetch(`${status.base}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: status.model,
      max_tokens: args.maxTokens ?? 1600,
      temperature: 0.2,
      system: args.system,
      messages: [{ role: "user", content: args.user }],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      ok: false,
      error: `Claude request failed (${response.status}). ${detail.slice(0, 240)}`,
    };
  }

  const payload = (await response.json()) as {
    content?: { type?: string; text?: string }[];
  };
  const text = payload.content?.find((part) => part.type === "text")?.text?.trim();
  if (!text) {
    return { ok: false, error: "Claude returned an empty response." };
  }
  return { ok: true, text };
}
