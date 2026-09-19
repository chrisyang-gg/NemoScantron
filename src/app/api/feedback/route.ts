import { setProposalStatus, snapshot } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    status?: "accepted" | "rejected";
  };

  if (!body.id || (body.status !== "accepted" && body.status !== "rejected")) {
    return Response.json({ error: "Need a proposal id and accepted/rejected." }, { status: 400 });
  }

  const proposal = setProposalStatus(body.id, body.status);
  if (!proposal) {
    return Response.json({ error: "No proposal with that id." }, { status: 404 });
  }

  return Response.json({ proposal, state: snapshot() });
}
