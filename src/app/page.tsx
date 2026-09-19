import { HomePage } from "@/components/site/home-page";
import { snapshot } from "@/lib/pipeline/store";

export const dynamic = "force-dynamic";

export default function Home() {
  return <HomePage stats={snapshot().stats} />;
}
