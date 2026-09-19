export type AgentEngine = {
  id: string;
  live: boolean;
  label: string;
};

const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

export function aiStatus(): AgentEngine {
  const key = process.env.NVIDIA_API_KEY?.trim();
  const model = process.env.NVIDIA_NEMOTRON_MODEL?.trim() || DEFAULT_MODEL;
  if (!key) {
    return {
      id: "nvidia-nemotron",
      live: false,
      label: "nvidia-nemotron (missing NVIDIA_API_KEY)",
    };
  }
  return { id: model, live: true, label: model };
}

export async function completeJson<T>(args: {
  system: string;
  user: string;
}): Promise<{ data: T; engine: AgentEngine } | null> {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.NVIDIA_NEMOTRON_MODEL?.trim() || DEFAULT_MODEL;
  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 1400,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    const data = parseJson<T>(content);
    if (!data) return null;
    return { data, engine: { id: model, live: true, label: model } };
  } catch {
    return null;
  }
}

function parseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
