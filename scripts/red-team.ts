import { loadLocalEnv } from "@/lib/env/load";
import { clampTestCount } from "@/lib/red-team/categories";
import { runTrainingRound, type TrainProgress } from "@/lib/feedback/train-ruleset";

loadLocalEnv();

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const help = args.includes("--help") || args.includes("-h");
const countIndex = args.findIndex((item) => item === "--count" || item === "-n");
const countArg = countIndex >= 0 ? args[countIndex + 1] : args.find((item) => /^\d+$/.test(item));

if (help) {
  console.log(`NemoScantron red-team trainer

  npm run red-team -- --count 4
  npm run red-team -- --count 4 --apply

  --count, -n   Number of Nemotron-generated tests (1–10, default 4)
  --apply       Write Claude's learned adjustments into RULES files 3–7
  --help        This text

Each test is generated individually by Nemotron, then scored by a second
Nemotron call with gold labels withheld. Claude only sees the RULES files
implicated by disagreements.`);
  process.exit(0);
}

const count = clampTestCount(countArg ?? 4);
if (countArg !== undefined && (Number(countArg) < 1 || Number(countArg) > 10)) {
  console.error("count must be between 1 and 10.");
  process.exit(1);
}

function onProgress(event: TrainProgress) {
  if (event.phase === "start") {
    console.log(`Red-team round ${event.round} · ${event.total} test${event.total === 1 ? "" : "s"} · apply=${apply}`);
    console.log("Phase 1 — Nemotron generates one credit-card case at a time\n");
    return;
  }
  if (event.phase === "generating") {
    process.stdout.write(
      `  [${event.index}/${event.total}] generating ${event.family} (${event.difficulty})…\n`,
    );
    return;
  }
  if (event.phase === "created") {
    const g = event.generated;
    console.log(
      `  [${event.index}/${event.total}] created ${g.id}  gold=${g.expectedDecision}  fraud=${g.expectedFraud ? "yes" : "no"}`,
    );
    console.log(`             ${g.description}`);
    return;
  }
  if (event.phase === "scoring") {
    if (event.index === 1) {
      console.log("\nPhase 2 — live Nemotron scores each case (gold withheld)\n");
    }
    process.stdout.write(`  [${event.index}/${event.total}] scoring ${event.id}…\n`);
    return;
  }
  if (event.phase === "scored") {
    const mark = event.row.needsAttention ? "MISS" : "ok";
    console.log(
      `  [${event.index}/${event.total}] scored ${event.row.decision}  gold ${event.row.expectedDecision}  ${mark}`,
    );
    return;
  }
  if (event.phase === "claude") {
    console.log("\nPhase 3 — Claude reviews only implicated RULES files");
    console.log(`  ${event.files.length ? event.files.join(", ") : "(none)"}\n`);
  }
}

async function main() {
  try {
    const result = await runTrainingRound({ apply, count, onProgress });
    console.log(`\nCatch ${result.catchRate}% · false positive ${result.falsePositiveRate}%`);
    if (result.missed.length) console.log(`Missed families: ${result.missed.join(", ")}`);
    console.log(`Cases saved in ${result.dir}`);
    for (const change of result.changes) {
      console.log(`  ${change.applied ? "wrote" : "draft"}  ${change.file}  ${change.note}`);
    }
    if (!apply && result.changes.some((item) => item.file.endsWith(".txt"))) {
      console.log("\nRe-run with --apply to write those lines into RULES files 3–7.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
