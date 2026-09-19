import { snapshot } from "@/lib/pipeline/store";
import { listRedTeamEvents } from "@/lib/pipeline/red-team";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ...snapshot(),
    redTeam: listRedTeamEvents().map((event) => ({
      id: event.id,
      name: event.name,
      expectedVerdict: event.expectedVerdict,
      filename: event.filename,
      notes: event.notes,
    })),
  });
}
