"use client";

import * as React from "react";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AIBadge } from "@/components/shared/EligibilityBadge";
import { AIAssistPanel } from "@/components/shared/AIAssistPanel";
import { parseNaturalLanguageQuery } from "@/lib/ai-search";
import { delay } from "@/lib/utils";
import type { ParsedSearchQuery } from "@/types";

interface Props {
  onParsed: (parsed: ParsedSearchQuery) => void;
}

export function AISearchBar({ onParsed }: Props) {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const [loading, setLoading] = React.useState(false);
  const [interpretation, setInterpretation] =
    React.useState<ParsedSearchQuery | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = filters.query.trim();
    if (!q) return;
    setLoading(true);
    setInterpretation(null);
    await delay(900); // simulate AI parsing
    const parsed = parseNaturalLanguageQuery(q);
    setInterpretation(parsed);
    onParsed(parsed);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Sparkles className="pointer-events-none absolute left-4 h-4 w-4 text-violet-500" />
          <Input
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            placeholder="Find fully-funded AI summer programs for Egyptian first-year students"
            className="pl-11 pr-28 h-12 rounded-2xl text-sm shadow-soft border-slate-200 dark:border-slate-700"
            aria-label="AI search"
          />
          <div className="absolute right-2 flex items-center gap-2">
            <AIBadge label="AI Search" size="sm" />
            <Button
              type="submit"
              size="sm"
              variant="ai"
              loading={loading}
              className="h-8"
            >
              {!loading && <Search className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>
      </form>

      {(loading || interpretation) && (
        <AIAssistPanel
          variant="inline"
          title={loading ? "Interpreting your search…" : "AI interpretation"}
          description={
            loading
              ? "Reading intent and mapping to filters"
              : interpretation?.explanation
          }
          loading={loading}
        >
          {!loading && interpretation && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(interpretation.extractedFilters).map(
                ([k, v]) =>
                  v && (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] border border-violet-200 text-violet-700 dark:bg-slate-900 dark:border-violet-500/30 dark:text-violet-300"
                    >
                      <span className="text-violet-500/70">{k}:</span>{" "}
                      <strong>{String(v)}</strong>
                    </span>
                  )
              )}
              {interpretation.semanticKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Matching keywords to verified opportunity fields…
            </div>
          )}
        </AIAssistPanel>
      )}
    </div>
  );
}
