"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function initials(name?: string) {
  if (!name) return "NP";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "NP";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ name, size = "md", className }: Props) {
  // Deterministic gradient from name
  const seed = name ? name.charCodeAt(0) + (name.charCodeAt(1) || 0) : 0;
  const hueA = seed % 360;
  const hueB = (seed * 7) % 360;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shadow-soft",
        sizes[size],
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hueA} 70% 55%), hsl(${hueB} 70% 50%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}
