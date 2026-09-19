import { redTeamEvents, type RedTeamFixture } from "@/lib/data/red-team-events";

export function listRedTeamEvents(): RedTeamFixture[] {
  return redTeamEvents;
}

export function getRedTeamEvent(id: string): RedTeamFixture | undefined {
  return redTeamEvents.find((event) => event.id === id);
}
