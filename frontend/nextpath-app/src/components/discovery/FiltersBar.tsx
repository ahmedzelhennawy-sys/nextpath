"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { cn, opportunityTypeLabel } from "@/lib/utils";
import type { FundingType, OpportunityType } from "@/types";

const ALL_TYPES: OpportunityType[] = [
  "scholarship",
  "internship",
  "hackathon",
  "research",
  "exchange",
  "training",
  "event",
  "volunteering",
  "competition",
];

const ALL_FUNDING: FundingType[] = [
  "fully_funded",
  "partial",
  "paid",
  "free",
  "unpaid",
  "fee_required",
];

const ALL_LOCATION: ("remote" | "in_person" | "hybrid")[] = [
  "remote",
  "in_person",
  "hybrid",
];

interface Props {
  resultCount: number;
}

export function FiltersBar({ resultCount }: Props) {
  const { filters, setFilters, resetFilters } = useAppStore();
  const [open, setOpen] = React.useState(false);

  const activeCount =
    filters.types.length +
    filters.fundingTypes.length +
    filters.locationMode.length +
    (filters.minMatchScore > 0 ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={open ? "primary" : "outline"}
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white/20 text-[10px] font-bold h-4 min-w-[1rem] px-1">
                {activeCount}
              </span>
            )}
          </Button>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {resultCount} {resultCount === 1 ? "result" : "results"}
          </span>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-0.5">
            {(["match", "deadline", "newest"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilters({ sort: opt })}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors",
                  filters.sort === opt
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {opt === "match"
                  ? "Best match"
                  : opt === "deadline"
                  ? "Deadline"
                  : "Newest"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {open && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-800 animate-fade-in">
          <FilterGroup
            label="Type"
            options={ALL_TYPES.map((t) => ({ value: t, label: opportunityTypeLabel(t) }))}
            selected={filters.types}
            onToggle={(v) =>
              setFilters({
                types: filters.types.includes(v as OpportunityType)
                  ? filters.types.filter((x) => x !== v)
                  : [...filters.types, v as OpportunityType],
              })
            }
          />
          <FilterGroup
            label="Funding"
            options={ALL_FUNDING.map((t) => ({
              value: t,
              label: t.replace(/_/g, " "),
            }))}
            selected={filters.fundingTypes}
            onToggle={(v) =>
              setFilters({
                fundingTypes: filters.fundingTypes.includes(v as FundingType)
                  ? filters.fundingTypes.filter((x) => x !== v)
                  : [...filters.fundingTypes, v as FundingType],
              })
            }
          />
          <FilterGroup
            label="Location"
            options={ALL_LOCATION.map((t) => ({
              value: t,
              label: t.replace(/_/g, " "),
            }))}
            selected={filters.locationMode}
            onToggle={(v) =>
              setFilters({
                locationMode: filters.locationMode.includes(
                  v as "remote" | "in_person" | "hybrid"
                )
                  ? filters.locationMode.filter((x) => x !== v)
                  : [...filters.locationMode, v as "remote" | "in_person" | "hybrid"],
              })
            }
            last
          />
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <label
                htmlFor="min-match"
                className="font-medium text-slate-700 dark:text-slate-300"
              >
                Minimum match score
              </label>
              <span className="font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                {filters.minMatchScore}%
              </span>
            </div>
            <input
              id="min-match"
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.minMatchScore}
              onChange={(e) =>
                setFilters({ minMatchScore: Number(e.target.value) })
              }
              className="w-full mt-2 accent-indigo-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  last,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  last?: boolean;
}) {
  return (
    <div className={cn("mb-4", last && "mb-0")}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              onClick={() => onToggle(o.value)}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
                active
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
