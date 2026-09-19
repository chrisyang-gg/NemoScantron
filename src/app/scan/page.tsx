import { ScanView } from "@/components/site/scan-view";
import { snapshot } from "@/lib/pipeline/store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan",
};

export const dynamic = "force-dynamic";

export default function ScanPage() {
  return <ScanView initial={snapshot()} />;
}
