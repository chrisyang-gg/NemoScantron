import { runPipeline } from "@/lib/pipeline";
import { getRedTeamEvent } from "@/lib/pipeline/red-team";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { eventId?: string };
  const event = body.eventId ? getRedTeamEvent(body.eventId) : undefined;

  if (!event) {
    return Response.json(
      { error: "Pick a red-team fixture to inject." },
      { status: 400 },
    );
  }

  const run = runPipeline({
    source: "red-team",
    prompt: event.prompt,
    rawText: event.body,
    filename: event.filename,
    expectedVerdict: event.expectedVerdict,
  });

  return Response.json({ run });
}
