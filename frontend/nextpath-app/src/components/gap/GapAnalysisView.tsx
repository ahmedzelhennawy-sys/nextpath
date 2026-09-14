"use client";

import * as React from "react";
import { TrendingUp, Lock, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AIAssistPanel } from "@/components/shared/AIAssistPanel";
import { useAppStore } from "@/store/useAppStore";
import { opportunities } from "@/data/mockData";
import { calculateMatchScore } from "@/lib/match";
import { evaluateEligibility } from "@/lib/eligibility";
import { cn } from "@/lib/utils";

interface Gap {
  label: string;
  unlocks: number;
  reason: string;
  category: "language" | "experience" | "academic" | "info";
}

export function GapAnalysisView() {
  const profile = useAppStore((s) => s.profile);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const data = React.useMemo(() => {
    const gaps = new Map<string, Gap>();
    let currentlyEligible = 0;
    let blocked = 0;
    let nearEligible = 0;

    for (const opp of opportunities) {
      const verdict = evaluateEligibility(profile, opp.id, opp.requirements);
      const match = calculateMatchScore(profile, opp);

      if (verdict.status === "eligible") currentlyEligible++;
      else if (verdict.status === "likely_eligible") nearEligible++;
      else if (verdict.status === "not_eligible") blocked++;
      else if (verdict.status === "unknown") nearEligible++;

      const candidateGaps: { key: string; category: Gap["category"]; reason: string }[] = [];

      if (verdict.whyNot) {
        for (const reason of verdict.whyNot) {
          if (reason.toLowerCase().includes("gpa")) {
            candidateGaps.push({
              key: "Higher GPA",
              category: "academic",
              reason,
            });
          } else if (reason.toLowerCase().includes("language")) {
            candidateGaps.push({
              key: "Higher English test score",
              category: "language",
              reason,
            });
          } else if (reason.toLowerCase().includes("experience")) {
            candidateGaps.push({
              key: "More experience records",
              category: "experience",
              reason,
            });
          } else {
            candidateGaps.push({
              key: `Requirement: ${reason.slice(0, 60)}…`,
              category: "academic",
              reason,
            });
          }
        }
      }

      if (verdict.missingInfo) {
        for (const reason of verdict.missingInfo) {
          if (reason.toLowerCase().includes("gpa")) {
            candidateGaps.push({
              key: "Add your GPA",
              category: "info",
              reason,
            });
          } else if (reason.toLowerCase().includes("ielts") || reason.toLowerCase().includes("english")) {
            candidateGaps.push({
              key: "Add IELTS / TOEFL score",
              category: "info",
              reason,
            });
          } else {
            candidateGaps.push({
              key: `Fill in: ${reason.slice(0, 50)}…`,
              category: "info",
              reason,
            });
          }
        }
      }

      if (match.gapAnalysis.missingToUnlock) {
        for (const m of match.gapAnalysis.missingToUnlock) {
          candidateGaps.push({
            key: m.length > 60 ? `${m.slice(0, 60)}…` : m,
            category: "language",
            reason: m,
          });
        }
      }

      for (const c of candidateGaps) {
        const existing = gaps.get(c.key);
        if (existing) existing.unlocks++;
        else
          gaps.set(c.key, {
            label: c.key,
            unlocks: 1,
            reason: c.reason,
            category: c.category,
          });
      }
    }

    return {
      gaps: Array.from(gaps.values())
        .sort((a, b) => b.unlocks - a.unlocks)
        .slice(0, 6),
      currentlyEligible,
      nearEligible,
      blocked,
    };
  }, [profile]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Profile gap analysis
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Computed deterministically from your profile and every opportunity's official
          requirements.
        </p>
      </header>

      {loading ? (
        <Card className="p-6 space-y-3">
          <div className="h-6 w-48 skeleton" />
          <div className="h-4 w-3/4 skeleton" />
          <div className="h-32 w-full skeleton mt-4" />
        </Card>
      ) : (
        <>
          <Card className="p-6 bg-gradient-to-br from-indigo-50 via-white to-violet-50/60 dark:from-indigo-500/5 dark:via-slate-900 dark:to-violet-500/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat
                label="Eligible now"
                value={data.currentlyEligible}
                tone="emerald"
                icon={TrendingUp}
              />
              <Stat
                label="Close to unlock"
                value={data.nearEligible}
                tone="amber"
                icon={Lock}
              />
              <Stat
                label="Currently blocked"
                value={data.blocked}
                tone="red"
                icon={AlertCircle}
              />
            </div>
          </Card>

          {data.gaps.length > 0 ? (
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>
                  You are close to{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {data.gaps.reduce((s, g) => s + g.unlocks, 0)}
                  </span>{" "}
                  more opportunities
                </CardTitle>
                <CardDescription>
                  Each missing item below was derived from the rule-based engine — no AI guesswork.
                </CardDescription>
              </CardHeader>
              <ul className="space-y-2 mt-4">
                {data.gaps.map((g) => (
                  <li
                    key={g.label}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div
                      className={cn(
                        "mt-0.5 inline-flex h-7 w-12 items-center justify-center rounded-md text-xs font-semibold",
                        g.category === "language" && "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                        g.category === "experience" && "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
                        g.category === "academic" && "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
                        g.category === "info" && "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      )}
                    >
                      +{g.unlocks}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {g.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {g.reason}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your profile is fully aligned with every requirement — nothing missing.
              </p>
            </Card>
          )}

          <AIAssistPanel
            title="Personalized next-step suggestions"
            description="Generated from your profile data and the gap analysis above. Use as a starting point only."
          >
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {generateSuggestions(data.gaps, profile).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500 mt-1 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </AIAssistPanel>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const styles = {
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    red: "bg-red-500/15 text-red-700 dark:text-red-300",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", styles[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function generateSuggestions(
  gaps: Gap[],
  profile: ReturnType<typeof useAppStore.getState>["profile"],
): string[] {
  const out: string[] = [];
  for (const g of gaps.slice(0, 3)) {
    if (g.category === "language") {
      out.push(`Register for an IELTS test — a score of 7.0+ would unlock ${g.unlocks} opportunities.`);
    } else if (g.category === "experience") {
      out.push(`Add a research or internship entry to your profile to clear ${g.unlocks} more requirements.`);
    } else if (g.category === "academic") {
      out.push(`Review programs where your current GPA is below the cutoff — ${g.unlocks} programs require a higher GPA than ${profile.education?.[0]?.gpa?.toFixed(2) ?? "yours"}.`);
    } else {
      out.push(`Fill in your profile details to unblock ${g.unlocks} verdicts currently marked "Needs info".`);
    }
  }
  if (out.length === 0) {
    out.push("Your profile is strong — focus on the highest match-score opportunities in Discover.");
  }
  return out;
}
