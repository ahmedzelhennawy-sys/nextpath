"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-indigo-600 text-white hover:bg-indigo-700 shadow-soft active:scale-[0.98]",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        outline:
          "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        ghost:
          "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        danger:
          "bg-red-500 text-white hover:bg-red-600 shadow-soft active:scale-[0.98]",
        ai: "bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700 shadow-soft active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
