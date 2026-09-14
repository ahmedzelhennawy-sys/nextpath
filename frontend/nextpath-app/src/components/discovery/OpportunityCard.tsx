"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, MapPin, Globe2, Calendar, Coins } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EligibilityBadge } from "@/components/shared/EligibilityBadge";
import { MatchScoreRing } from "@/components/shared/MatchScore";
import { cn, formatDeadline, fundingLabel, opportunityTypeLabel } from "@/lib/utils";
import type { EligibilityVerdict, MatchScoreResult, Opportunity } from "@/types";

interface Props {
  opportunity: Opportunity;
  verdict: EligibilityVerdict;
  match: MatchScoreResult;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
  inTracker: boolean;
}

export function OpportunityCard({
  opportunity,
  verdict,
  match,
  saved,
  onOpen,
  onToggleSave,
  inTracker,
}: Props) {
  const deadline = formatDeadline(opportunity.deadline);
  return (
    <Card
      role="article"
      className="group relative flex flex-col gap-3 p-5 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer"
      onClick={onOpen}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave();
        }}
        aria-label={saved ? "Unsave opportunity" : "Save opportunity"}
        className={cn(
          "absolute right-3 top-3 p-1.5 rounded-lg transition-all",
          saved
            ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        )}
      >
        {saved ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </button>

      <div className="flex items-start gap-3 pr-8">
        <MatchScoreRing score={match.totalScore} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant="neutral" className="capitalize">
              {opportunityTypeLabel(opportunity.type)}
            </Badge>
            <EligibilityBadge status={verdict.status} size="sm" />
            {inTracker && (
              <Badge variant="indigo" className="capitalize">
                In tracker
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
            {opportunity.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {opportunity.organizationName}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {fundingLabel(opportunity.fundingType)}
        </span>
        <span className="inline-flex items-center gap-1">
          {opportunity.locationMode === "remote" ? (
            <Globe2 className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {opportunity.locationCountry || "Worldwide"}{" "}
          <span className="capitalize">· {opportunity.locationMode.replace("_", " ")}</span>
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium",
            deadline.isUrgent && "text-amber-600 dark:text-amber-400",
            deadline.isPast && "text-red-600 dark:text-red-400"
          )}
        >
          <Calendar className="h-3 w-3" />
          {deadline.label}
        </span>
      </div>

      {opportunity.tags && opportunity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {opportunity.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
