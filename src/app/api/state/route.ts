import { snapshot } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(snapshot());
}
