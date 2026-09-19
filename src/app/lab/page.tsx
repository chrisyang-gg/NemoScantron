import { LabView } from "@/components/site/lab-view";
import { attackFamilies } from "@/lib/data/attack-families";
import { snapshot } from "@/lib/pipeline/store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lab",
};

export const dynamic = "force-dynamic";

export default function LabPage() {
  return <LabView initial={{ ...snapshot(), attackFamilies }} />;
}
