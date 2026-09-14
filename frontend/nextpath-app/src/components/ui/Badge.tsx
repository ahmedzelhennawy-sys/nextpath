"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "eligible"
    | "likely"
    | "unknown"
    | "ineligible"
    | "ai"
    | "outline"
    | "indigo"
    | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    eligible: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    likely: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    unknown: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600",
    ineligible: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
    ai: "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
    outline: "border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
    neutral: "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
