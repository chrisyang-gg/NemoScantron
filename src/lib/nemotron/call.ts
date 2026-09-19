const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

export function nemotronStatus() {
  const key = process.env.NVIDIA_API_KEY?.trim();
  const model = process.env.NVIDIA_NEMOTRON_MODEL?.trim() || DEFAULT_MODEL;
  if (!key) {
    return { live: false, model, label: "nemoscantron-local (ruleset mock)" };
  }
  return { live: true, model, label: model };
}

export async function callNemotron(prompt: string): Promise<string | null> {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.NVIDIA_NEMOTRON_MODEL?.trim() || DEFAULT_MODEL;
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 1600,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content ?? null;
}
