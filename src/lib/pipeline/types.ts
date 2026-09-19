export type SourceKind = "website" | "red-team";
export type OwnerLane = "intake" | "policy" | "execution";
export type RuleSeverity = "block" | "flag" | "watch";
export type Verdict = "clear" | "suspicious" | "fraud";
export type ActionKind =
  | "hold_funds"
  | "notify_analyst"
  | "close_case"
  | "escalate"
  | "log_only";
export type ActionStatus = "queued" | "dispatched" | "done";
export type ProposalStatus = "pending" | "accepted" | "rejected";

export type ScanInput = {
  id: string;
  source: SourceKind;
  filename?: string;
  prompt: string;
  rawText: string;
  expectedVerdict?: Verdict;
  createdAt: string;
  redTeam?: {
    family: string;
    name: string;
    attackPlan: string;
    engine: string;
  };
};

export type SanitizedInput = {
  text: string;
  originalChars: number;
  stripped: string[];
  warnings: string[];
  masked: { label: string; count: number }[];
};

export type Rule = {
  id: string;
  title: string;
  policy: string;
  signals: string[];
  minHits: number;
  severity: RuleSeverity;
  enabled: boolean;
  owner: OwnerLane;
};

export type RuleHit = {
  ruleId: string;
  title: string;
  severity: RuleSeverity;
  policy: string;
  evidence: string[];
};

export type ReasoningStep = {
  title: string;
  detail: string;
};

export type ReasoningResult = {
  engine: string;
  verdict: Verdict;
  riskScore: number;
  confidence: number;
  summary: string;
  steps: ReasoningStep[];
  matchedRules: RuleHit[];
  explanation: {
    headline: string;
    body: string;
    findings: {
      title: string;
      severity: RuleSeverity;
      policy: string;
      evidence: string[];
      why: string;
    }[];
  };
};

export type ExecutionAction = {
  id: string;
  kind: ActionKind;
  status: ActionStatus;
  note: string;
};

export type FeedbackProposal = {
  id: string;
  fromRunId: string;
  reason: string;
  proposedRule: Rule;
  status: ProposalStatus;
  engine: string;
  missKind: "false-negative" | "false-positive";
  steps: ReasoningStep[];
};

export type GeneratedAttack = {
  id: string;
  family: string;
  name: string;
  expectedVerdict: Verdict;
  filename: string;
  prompt: string;
  body: string;
  attackPlan: string;
  evadeNotes: string[];
  engine: string;
  createdAt: string;
};

export type PipelineRun = {
  id: string;
  input: ScanInput;
  sanitized: SanitizedInput;
  reasoning: ReasoningResult;
  actions: ExecutionAction[];
  metrics: {
    riskScore: number;
    ruleHits: number;
    latencyMs: number;
    description: string;
  };
  feedback: FeedbackProposal[];
};

export type WorkflowPack = {
  name: string;
  description: string;
  steps: string[];
};

export type ConsoleState = {
  workflow: WorkflowPack;
  rules: Rule[];
  runs: PipelineRun[];
  proposals: FeedbackProposal[];
  generatedAttacks: GeneratedAttack[];
  ai: {
    live: boolean;
    label: string;
  };
  stats: {
    scanned: number;
    fraud: number;
    suspicious: number;
    clear: number;
    pendingFeedback: number;
  };
};
