"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import { opportunities as seedOpportunities } from "@/data/mockData";
import { evaluateEligibility } from "@/lib/eligibility";
import { calculateMatchScore } from "@/lib/match";
import { parseNaturalLanguageQuery } from "@/lib/ai-search";
import { delay } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  EligibilityVerdict,
  MatchScoreResult,
  Opportunity,
  ParsedSearchQuery,
} from "@/types";

export interface RankedOpportunity {
  opportunity: Opportunity;
  verdict: EligibilityVerdict;
  match: MatchScoreResult;
}

export function useDiscovery() {
  const profile = useAppStore((s) => s.profile);
  const filters = useAppStore((s) => s.filters);

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RankedOpportunity[]>([]);
  const [activeInterpretation, setActiveInterpretation] =
    React.useState<ParsedSearchQuery | null>(null);

  const debouncedQuery = useDebounce(filters.query, 300);

  // Initial + on-profile-change "checking eligibility…" pulse
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      await delay(650);
      if (cancelled) return;
      const next = seedOpportunities.map((opp) => ({
        opportunity: opp,
        verdict: evaluateEligibility(profile, opp.id, opp.requirements),
        match: calculateMatchScore(profile, opp),
      }));
      setItems(next);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const handleParsed = React.useCallback((parsed: ParsedSearchQuery) => {
    setActiveInterpretation(parsed);
  }, []);

  const filtered = React.useMemo(() => {
    let list = items;

    if (filters.types.length > 0) {
      list = list.filter((x) => filters.types.includes(x.opportunity.type));
    }
    if (filters.fundingTypes.length > 0) {
      list = list.filter((x) => filters.fundingTypes.includes(x.opportunity.fundingType));
    }
    if (filters.locationMode.length > 0) {
      list = list.filter((x) => filters.locationMode.includes(x.opportunity.locationMode));
    }
    if (filters.minMatchScore > 0) {
      list = list.filter((x) => x.match.totalScore >= filters.minMatchScore);
    }

    // Natural-language keyword filter (overlap with title/field/description/tags)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter(({ opportunity }) => {
        const haystack = [
          opportunity.title,
          opportunity.description,
          opportunity.field,
          opportunity.organizationName,
          ...(opportunity.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        // At least one token matches OR parsed interpretation matches type/funding
        if (
          tokens.some((t) => t.length > 1 && haystack.includes(t))
        ) {
          return true;
        }
        return false;
      });
    }

    // Apply AI-interpretation filters if user just searched
    if (activeInterpretation) {
      const f = activeInterpretation.extractedFilters;
      if (f.type) list = list.filter((x) => x.opportunity.type === f.type);
      if (f.fundingType)
        list = list.filter((x) => x.opportunity.fundingType === f.fundingType);
      if (f.field) {
        list = list.filter((x) =>
          (x.opportunity.field ?? "")
            .toLowerCase()
            .includes(String(f.field).toLowerCase())
        );
      }
      if (f.locationCountry) {
        list = list.filter(
          (x) =>
            (x.opportunity.locationCountry ?? "")
              .toLowerCase()
              .includes(String(f.locationCountry).toLowerCase())
        );
      }
      if (f.locationMode) {
        list = list.filter((x) => x.opportunity.locationMode === f.locationMode);
      }
    }

    // Sort
    if (filters.sort === "match") {
      list = [...list].sort((a, b) => b.match.totalScore - a.match.totalScore);
    } else if (filters.sort === "deadline") {
      list = [...list].sort((a, b) => {
        const da = a.opportunity.deadline
          ? new Date(a.opportunity.deadline).getTime()
          : Number.MAX_SAFE_INTEGER;
        const db = b.opportunity.deadline
          ? new Date(b.opportunity.deadline).getTime()
          : Number.MAX_SAFE_INTEGER;
        return da - db;
      });
    } else {
      list = [...list].sort((a, b) => {
        const oa = seedOpportunities.findIndex((o) => o.id === a.opportunity.id);
        const ob = seedOpportunities.findIndex((o) => o.id === b.opportunity.id);
        return oa - ob;
      });
    }

    return list;
  }, [items, filters, debouncedQuery, activeInterpretation]);

  return {
    items: filtered,
    totalCount: items.length,
    loading,
    handleParsed,
    activeInterpretation,
  };
}

export function getInterpretationFromQuery(query: string) {
  return parseNaturalLanguageQuery(query);
}
