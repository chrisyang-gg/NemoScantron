import { runAnalyze } from "@/lib/nemotron/run-analyze";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    notes?: string | null;
    file?: { name: string; text: string; mime?: string } | null;
  };

  const result = await runAnalyze({
    notes: body.notes,
    file: body.file ?? null,
  });

  if (!result.ok) {
    return Response.json(result, { status: 400 });
  }
  return Response.json(result);
}
