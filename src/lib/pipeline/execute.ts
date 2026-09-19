import type {
  ExecutionAction,
  ReasoningResult,
  SourceKind,
} from "@/lib/pipeline/types";

export function dispatchWithNemo(
  reasoning: ReasoningResult,
  source: SourceKind,
): ExecutionAction[] {
  const actions: ExecutionAction[] = [];
  const tag = source === "red-team" ? "Synthetic red-team case." : "Live website intake.";

  if (source === "red-team") {
    actions.push(action("log_only", "done", `${tag} Logged for ruleset training; no customer money is touched.`));
  }

  switch (reasoning.verdict) {
    case "fraud":
      actions.push(
        action("hold_funds", "dispatched", "Nemo holds any pending payout on this case."),
        action("escalate", "dispatched", "Nemo opens a fraud-queue ticket with the reasoning trace."),
      );
      break;
    case "suspicious":
      actions.push(
        action(
          "notify_analyst",
          "dispatched",
          "Nemo pages the on-call analyst with the policy hits and asks for dual control.",
        ),
      );
      break;
    case "clear":
      actions.push(
        action("close_case", "done", "Nemo closes the case and writes a clear metric back to the website."),
      );
      break;
  }

  return actions;
}

function action(
  kind: ExecutionAction["kind"],
  status: ExecutionAction["status"],
  note: string,
): ExecutionAction {
  return {
    id: `act_${crypto.randomUUID().slice(0, 8)}`,
    kind,
    status,
    note,
  };
}
