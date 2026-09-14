"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pill";
  className?: string;
}

export function Tabs({
  items,
  activeId,
  onChange,
  variant = "underline",
  className,
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex",
        variant === "underline"
          ? "border-b border-slate-200 dark:border-slate-800 gap-1"
          : "gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
              variant === "underline"
                ? cn(
                    "border-b-2 -mb-px",
                    active
                      ? "border-indigo-600 text-indigo-700 dark:text-indigo-300"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  )
                : cn(
                    "rounded-lg",
                    active
                      ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  )
            )}
          >
            {item.icon}
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
