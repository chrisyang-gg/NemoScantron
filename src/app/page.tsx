import { ConsoleApp } from "@/components/console/console-app";
import { listRedTeamEvents } from "@/lib/pipeline/red-team";
import { snapshot } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const state = snapshot();
  const redTeam = listRedTeamEvents().map((event) => ({
    id: event.id,
    name: event.name,
    expectedVerdict: event.expectedVerdict,
    filename: event.filename,
    notes: event.notes,
  }));

  return <ConsoleApp initial={{ ...state, redTeam }} />;
}
