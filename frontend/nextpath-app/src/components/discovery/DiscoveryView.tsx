"use client";

import * as React from "react";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { AISearchBar } from "@/components/discovery/AISearchBar";
import { FiltersBar } from "@/components/discovery/FiltersBar";
import { OpportunityCard } from "@/components/discovery/OpportunityCard";
import { OpportunityDetailSheet } from "@/components/discovery/OpportunityDetailSheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDiscovery } from "@/hooks/useDiscovery";
import { opportunities } from "@/data/mockData";

export function DiscoveryView() {
  const { items, loading, handleParsed } = useDiscovery();
  const savedIds = useAppStore((s) => s.savedOpportunityIds);
  const toggleSaved = useAppStore((s) => s.toggleSaved);
  const openOpportunityDetail = useAppStore((s) => s.openOpportunityDetail);
  const detailOpportunityId = useAppStore((s) => s.detailOpportunityId);
  const applications = useAppStore((s) => s.applications);

  const detailOpp =
    detailOpportunityId !== null
      ? opportunities.find((o) => o.id === detailOpportunityId) ?? null
      : null;

  return (
    <div className="space-y-6">
      {/* Hero / Search */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 p-5 md:p-6 shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-violet-500/5">
        <div className="max-w-3xl">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Find what to apply for next
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Search across scholarships, internships, hackathons, research, exchanges, and
            more. Every result comes with a rule-based eligibility verdict — never an AI guess.
          </p>
        </div>
        <div className="mt-5">
          <AISearchBar onParsed={handleParsed} />
        </div>
      </div>

      <FiltersBar resultCount={items.length} />

      {loading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {items.map(({ opportunity, verdict, match }) => {
            const inTracker = applications.some(
              (a) => a.opportunityId === opportunity.id
            );
            return (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                verdict={verdict}
                match={match}
                saved={savedIds.includes(opportunity.id)}
                onToggleSave={() => toggleSaved(opportunity.id)}
                onOpen={() => openOpportunityDetail(opportunity.id)}
                inTracker={inTracker}
              />
            );
          })}
        </div>
      )}

      <OpportunityDetailSheet
        opportunity={detailOpp}
        onClose={() => openOpportunityDetail(null)}
      />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  const { filters, resetFilters } = useAppStore();
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Search className="h-5 w-5 text-slate-500" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        No opportunities match your filters
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Try clearing some filters or broadening your search.
      </p>
      {(filters.types.length > 0 ||
        filters.fundingTypes.length > 0 ||
        filters.locationMode.length > 0 ||
        filters.minMatchScore > 0 ||
        filters.query) && (
        <Button variant="outline" className="mt-4" onClick={resetFilters}>
          Reset all filters
        </Button>
      )}
    </Card>
  );
}
