const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_BASE = "https://integrate.api.nvidia.com/v1";

const SCORE_SYSTEM =
  "You are Nemotron scoring credit-card fraud. Follow the assembled ruleset exactly. Read every CORE and RULES file, then the optional user context, then the transaction JSON. Execute the ten-step workflow. Reply with one FILE 8 JSON object or array only — no markdown fences, no preamble. Escape every double quote inside string values. Keep reasoning to two short sentences when scoring more than one record.";

export type CallNemotronOptions = {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export function nemotronStatus() {
  const key = process.env.NVIDIA_API_KEY?.trim();
  const model = process.env.NVIDIA_NEMOTRON_MODEL?.trim() || DEFAULT_MODEL;
  const base = (process.env.NVIDIA_API_BASE?.trim() || DEFAULT_BASE).replace(/\/$/, "");
  return {
    live: Boolean(key),
    model,
    base,
    label: key ? model : "nvidia-nemotron (missing NVIDIA_API_KEY)",
  };
}

export async function callNemotron(
  prompt: string,
  options: CallNemotronOptions = {},
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const status = nemotronStatus();
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      error: "NVIDIA_API_KEY is missing. Add it to .env and restart the dev server.",
    };
  }

  const response = await fetch(`${status.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: status.model,
      temperature: options.temperature ?? 0.1,
      top_p: 0.95,
      max_tokens: options.maxTokens ?? 8192,
      stream: false,
      chat_template_kwargs: { enable_thinking: false },
      messages: [
        {
          role: "system",
          content: options.system ?? SCORE_SYSTEM,
        },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 90_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      ok: false,
      error: `Nemotron request failed (${response.status}). ${detail.slice(0, 240)}`,
    };
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return { ok: false, error: "Nemotron returned an empty response." };
  }
  return { ok: true, text };
}
