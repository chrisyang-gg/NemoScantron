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
      { error: "Paste a file body or drop a text file before scanning." },
      { status: 400 },
    );
  }

  const run = runPipeline({
    source: "website",
    prompt: body.prompt ?? "",
    rawText,
    filename: body.filename,
  });

  return Response.json({ run });
}
