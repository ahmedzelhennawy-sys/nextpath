"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ApplicationsView } from "@/components/applications/ApplicationsView";

export default function ApplicationsPage() {
  return (
    <React.Suspense fallback={null}>
      <ApplicationsPageInner />
    </React.Suspense>
  );
}

function ApplicationsPageInner() {
  const params = useSearchParams();
  const focusedAppId = params.get("app") ?? undefined;
  return <ApplicationsView focusedAppId={focusedAppId} />;
}
