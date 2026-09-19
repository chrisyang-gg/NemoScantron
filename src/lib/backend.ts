export type BackendPayload = {
  userLines: string[];
  file: { name: string; text: string } | null;
  combined: string;
};

/** Placeholder until the scoring API is wired. */
export async function sendToBackend(payload: BackendPayload): Promise<void> {
  void payload;
}

export function buildBackendPayload(
  text: string,
  file: { name: string; text: string } | null,
): BackendPayload {
  const userLines = text.split(/\r?\n/);
  const header = userLines.join("\n").replace(/\s+$/, "");
  const body = file?.text ?? "";
  const combined = header && body ? `${header}\n${body}` : header || body;
  return {
    userLines,
    file: file ? { name: file.name, text: file.text } : null,
    combined,
  };
}
