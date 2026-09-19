import { resetStore, snapshot, upsertRule } from "@/lib/pipeline/store";
import type { Rule } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ rules: snapshot().rules });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("reset") === "1") {
    resetStore();
    return Response.json(snapshot());
  }

  const body = (await request.json()) as { rule?: Rule };
  if (!body.rule?.id || !body.rule.title) {
    return Response.json({ error: "Rule needs an id and title." }, { status: 400 });
  }
  upsertRule(body.rule);
  return Response.json({ rules: snapshot().rules });
}
