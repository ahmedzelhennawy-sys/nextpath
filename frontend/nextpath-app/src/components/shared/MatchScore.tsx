"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  score: number; // 0–100
  size?: number; // px
  label?: string;
  className?: string;
  animate?: boolean;
}

export function MatchScoreRing({
  score,
  size = 64,
  label,
  className,
  animate = true,
}: Props) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const stroke = 6;
  const center = size / 2;

  const tone =
    score >= 75
      ? "stroke-emerald-500"
      : score >= 50
      ? "stroke-amber-500"
      : score >= 25
      ? "stroke-orange-400"
      : "stroke-slate-300 dark:stroke-slate-600";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          className={cn("transition-[stroke-dashoffset] duration-1000", tone)}
          style={
            animate
              ? ({
                  animation: `draw-circle 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                  "--offset": offset,
                } as React.CSSProperties)
              : { strokeDashoffset: offset }
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {score}
        </span>
        {label && (
          <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface BarProps {
  score: number;
  label?: string;
  max?: number;
  className?: string;
}

export function MatchBar({ score, label, max = 30, className }: BarProps) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
            {score}/{max}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
