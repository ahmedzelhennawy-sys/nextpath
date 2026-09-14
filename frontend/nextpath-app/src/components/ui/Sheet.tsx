"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "right" | "bottom";
  className?: string;
  ariaLabel: string;
}

export function Sheet({
  open,
  onClose,
  children,
  side = "right",
  className,
  ariaLabel,
}: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      />
      <div
        className={cn(
          "relative ml-auto h-full bg-white dark:bg-slate-900 shadow-elevated",
          side === "right" && "w-full max-w-2xl animate-slide-in-right",
          side === "bottom" &&
            "w-full max-h-[90vh] mt-auto rounded-t-2xl animate-slide-in-right",
          className
        )}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
