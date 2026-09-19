import { HowItWorksPage } from "@/components/site/how-it-works-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
};

export default function HowItWorks() {
  return <HowItWorksPage />;
}
