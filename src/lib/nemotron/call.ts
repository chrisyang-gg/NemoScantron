const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_BASE = "https://integrate.api.nvidia.com/v1";

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
      temperature: 0.1,
      max_tokens: 1600,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45_000),
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
