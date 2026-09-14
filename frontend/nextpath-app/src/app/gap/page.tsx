import { Suspense } from "react";
import { GapAnalysisView } from "@/components/gap/GapAnalysisView";

export default function GapPage() {
  return (
    <Suspense fallback={null}>
      <GapAnalysisView />
    </Suspense>
  );
}
