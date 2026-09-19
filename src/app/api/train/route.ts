import { generateRedTeamEvent } from "@/lib/ai/red-team-agent";
import { runPipeline, runRequestFromAttack } from "@/lib/pipeline";
import {
  addGeneratedAttack,
  getStore,
  setProposalStatus,
  snapshot,
} from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    family?: string;
    brief?: string;
    apply?: boolean;
  };

  const event = await generateRedTeamEvent(getStore().rules, {
    family: body.family ?? "evade",
    brief:
      body.brief ??
      "Introduce a new suspicious payment trend the current pack does not score.",
  });
  addGeneratedAttack(event);
  const run = await runPipeline(runRequestFromAttack(event));

  const applied = [];
  if (body.apply) {
    for (const proposal of run.feedback) {
      const saved = setProposalStatus(proposal.id, "accepted");
      if (saved) applied.push(saved.proposedRule.title);
    }
  }

  return Response.json({
    event: {
      id: event.id,
      name: event.name,
      family: event.family,
      attackPlan: event.attackPlan,
      engine: event.engine,
      expectedVerdict: event.expectedVerdict,
    },
    run: {
      id: run.id,
      verdict: run.reasoning.verdict,
      riskScore: run.metrics.riskScore,
      summary: run.reasoning.summary,
    },
    feedback: run.feedback.map((item) => ({
      id: item.id,
      missKind: item.missKind,
      title: item.proposedRule.title,
      signals: item.proposedRule.signals,
      reason: item.reason,
    })),
    applied,
    state: snapshot().stats,
  });
}
