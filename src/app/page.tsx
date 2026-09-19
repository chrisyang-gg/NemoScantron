import { ScanView } from "@/components/site/scan-view";
import { snapshot } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export default function Home() {
  return <ScanView initial={snapshot()} />;
}
