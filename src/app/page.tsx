import { ConsoleApp } from "@/components/console/console-app";
import { attackFamilies } from "@/lib/data/attack-families";
import { snapshot } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <ConsoleApp initial={{ ...snapshot(), attackFamilies }} />
  );
}
