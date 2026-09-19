import { defaultRules, defaultWorkflow } from "@/lib/data/default-rules";
import { aiStatus } from "@/lib/ai/engine";
import type {
  ConsoleState,
  FeedbackProposal,
  GeneratedAttack,
  PipelineRun,
  Rule,
  WorkflowPack,
} from "@/lib/pipeline/types";

type Store = {
  workflow: WorkflowPack;
  rules: Rule[];
  runs: PipelineRun[];
  proposals: FeedbackProposal[];
  generatedAttacks: GeneratedAttack[];
};

const globalForStore = globalThis as unknown as { __nemoscantron?: Store };

function createStore(): Store {
  return {
    workflow: defaultWorkflow,
    rules: structuredClone(defaultRules),
    runs: [],
    proposals: [],
    generatedAttacks: [],
  };
}

export function getStore(): Store {
  if (!globalForStore.__nemoscantron) {
    globalForStore.__nemoscantron = createStore();
  }
  return globalForStore.__nemoscantron;
}

export function resetStore(): Store {
  globalForStore.__nemoscantron = createStore();
  return globalForStore.__nemoscantron;
}

export function snapshot(): ConsoleState {
  const store = getStore();
  const runs = store.runs;
  const ai = aiStatus();
  return {
    workflow: store.workflow,
    rules: store.rules,
    runs,
    proposals: store.proposals,
    generatedAttacks: store.generatedAttacks,
    ai: { live: ai.live, label: ai.label },
    stats: {
      scanned: runs.length,
      fraud: runs.filter((r) => r.reasoning.verdict === "fraud").length,
      suspicious: runs.filter((r) => r.reasoning.verdict === "suspicious").length,
      clear: runs.filter((r) => r.reasoning.verdict === "clear").length,
      pendingFeedback: store.proposals.filter((p) => p.status === "pending").length,
    },
  };
}

export function addRun(run: PipelineRun) {
  getStore().runs = [run, ...getStore().runs].slice(0, 50);
}

export function addProposals(proposals: FeedbackProposal[]) {
  if (!proposals.length) return;
  getStore().proposals = [...proposals, ...getStore().proposals];
}

export function addGeneratedAttack(event: GeneratedAttack) {
  getStore().generatedAttacks = [event, ...getStore().generatedAttacks].slice(0, 20);
}

export function getGeneratedAttack(id: string): GeneratedAttack | undefined {
  return getStore().generatedAttacks.find((event) => event.id === id);
}

export function upsertRule(rule: Rule) {
  const store = getStore();
  const index = store.rules.findIndex((item) => item.id === rule.id);
  if (index >= 0) store.rules[index] = rule;
  else store.rules = [rule, ...store.rules];
}

export function setProposalStatus(
  id: string,
  status: FeedbackProposal["status"],
): FeedbackProposal | undefined {
  const proposal = getStore().proposals.find((item) => item.id === id);
  if (!proposal) return undefined;
  proposal.status = status;
  if (status === "accepted") {
    upsertRule({ ...proposal.proposedRule, enabled: true });
  }
  return proposal;
}
