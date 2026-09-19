import { generateRedTeamEvent } from "@/lib/ai/red-team-agent";
import { runPipeline, runRequestFromAttack } from "@/lib/pipeline";
import { addGeneratedAttack, getGeneratedAttack, getStore } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    family?: string;
    brief?: string;
    replayId?: string;
  };

  if (body.replayId) {
    const event = getGeneratedAttack(body.replayId);
    if (!event) {
      return Response.json({ error: "No generated attack with that id to replay." }, { status: 404 });
    }
    const run = await runPipeline(runRequestFromAttack(event));
    return Response.json({ event, run });
  }

  const event = await generateRedTeamEvent(getStore().rules, {
    family: body.family,
    brief: body.brief,
  });
  addGeneratedAttack(event);
  const run = await runPipeline(runRequestFromAttack(event));
  return Response.json({ event, run });
}
