"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, CircleHelp, XCircle, Sparkles } from "lucide-react";
import { cn, eligibilityLabel } from "@/lib/utils";
import type { EligibilityStatus } from "@/types";

interface Props {
  status: EligibilityStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

// Deterministic styling — NOT AI-flavored. Uses the rule-engine palette
// (emerald / amber / slate / red) and never the violet AI accent.
const config: Record<
  EligibilityStatus,
  {
    bg: string;
    text: string;
    border: string;
    Icon: React.ComponentType<{ className?: string }>;
    dot: string;
  }
> = {
  eligible: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/30",
    Icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  likely_eligible: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-500/30",
    Icon: AlertTriangle,
    dot: "bg-amber-500",
  },
  unknown: {
    bg: "bg-slate-100 dark:bg-slate-700/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-600",
    Icon: CircleHelp,
    dot: "bg-slate-400",
  },
  not_eligible: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/30",
    Icon: XCircle,
    dot: "bg-red-500",
  },
};

export function EligibilityBadge({
  status,
  size = "md",
  showLabel = true,
  className,
}: Props) {
  const c = config[status];
  const Icon = c.Icon;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";

  return (
    <span
      role="status"
      aria-label={`Eligibility: ${eligibilityLabel(status)}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        padding,
        c.bg,
        c.text,
        c.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot, dotSize)} aria-hidden="true" />
      <Icon className={iconSize} aria-hidden="true" />
      {showLabel && eligibilityLabel(status)}
    </span>
  );
}

interface AIBadgeProps {
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

// Distinct visual treatment for AI-generated/AI-derived content.
// Violet accent + Sparkles icon — never used for eligibility verdicts.
export function AIBadge({ label = "AI assist", className, size = "md" }: AIBadgeProps) {
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
        padding,
        className
      )}
      title="This content is generated or interpreted by an AI model — not by the rule engine."
    >
      <Sparkles className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
      {label}
    </span>
  );
}
