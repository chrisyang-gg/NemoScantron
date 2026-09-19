import { runPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
    rawText?: string;
    filename?: string;
  };

  const rawText = body.rawText?.trim() ?? "";
  if (!rawText) {
    return Response.json(
      { error: "Upload a transaction history or describe it in text." },
      { status: 400 },
    );
  }

  const run = await runPipeline({
    source: "website",
    prompt: body.prompt ?? "",
    rawText,
    filename: body.filename,
  });

  return Response.json({ run });
}
