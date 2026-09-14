"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastHost() {
  const { notifications, dismissNotification } = useAppStore();
  React.useEffect(() => {
    const timers = notifications.map((n) =>
      setTimeout(() => dismissNotification(n.id), n.durationMs ?? 3500)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismissNotification]);

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {notifications.map((n) => {
        const Icon =
          n.variant === "success"
            ? CheckCircle2
            : n.variant === "error"
            ? AlertCircle
            : n.variant === "info"
            ? Info
            : Info;
        return (
          <div
            key={n.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-elevated animate-scale-in dark:bg-slate-800",
              n.variant === "success" && "border-emerald-200 dark:border-emerald-500/30",
              n.variant === "error" && "border-red-200 dark:border-red-500/30",
              (!n.variant || n.variant === "default" || n.variant === "info") &&
                "border-slate-200 dark:border-slate-700"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 mt-0.5",
                n.variant === "success" && "text-emerald-500",
                n.variant === "error" && "text-red-500",
                (!n.variant || n.variant === "default" || n.variant === "info") &&
                  "text-indigo-500"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {n.title}
              </div>
              {n.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {n.description}
                </div>
              )}
            </div>
            <button
              aria-label="Dismiss"
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
