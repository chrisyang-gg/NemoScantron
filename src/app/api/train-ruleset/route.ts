import { runTrainingRound } from "@/lib/feedback/train-ruleset";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    apply?: boolean;
    count?: number;
  };
  try {
    const result = await runTrainingRound({
      apply: Boolean(body.apply),
      count: body.count,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Training failed.";
    const status = message.includes("NVIDIA_API_KEY") ? 503 : 400;
    return Response.json({ ok: false, error: message }, { status });
  }
}
