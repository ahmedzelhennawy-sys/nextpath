"use client";

import * as React from "react";
import { AIBadge } from "./EligibilityBadge";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: "panel" | "inline";
}

// Visual wrapper for any AI-generated or AI-interpreted content
// to make it instantly clear that this is AI assist, not a verified
// rule-engine fact.
export function AIAssistPanel({
  title,
  description,
  loading,
  children,
  className,
  variant = "panel",
}: Props) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-500/30 dark:bg-violet-500/5",
          className
        )}
      >
        <div className="flex items-start gap-2">
          <AIBadge label="AI assist" size="sm" />
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />}
        </div>
        {title && (
          <div className="mt-2 text-sm font-medium text-violet-900 dark:text-violet-200">
            {title}
          </div>
        )}
        {description && (
          <div className="mt-1 text-xs text-violet-700/80 dark:text-violet-300/80">
            {description}
          </div>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    );
  }

  return (
    <section
      aria-label={`AI assist: ${title}`}
      className={cn(
        "rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-50/40 p-5 shadow-soft dark:border-violet-500/30 dark:from-violet-500/5 dark:via-slate-900 dark:to-violet-500/5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <AIBadge label="AI assist" size="sm" />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
