"use client";

import * as React from "react";
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  CircleHelp,
  ArrowRight,
  Sparkles,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Play,
} from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { EligibilityBadge } from "@/components/shared/EligibilityBadge";
import { MatchScoreRing, MatchBar } from "@/components/shared/MatchScore";
import { AIBadge } from "@/components/shared/EligibilityBadge";
import { AIAssistPanel } from "@/components/shared/AIAssistPanel";
import { useAppStore } from "@/store/useAppStore";
import { calculateMatchScore } from "@/lib/match";
import { evaluateEligibility } from "@/lib/eligibility";
import { delay, formatDeadline, fundingLabel, opportunityTypeLabel, cn } from "@/lib/utils";
import type { EligibilityVerdict, MatchScoreResult, Opportunity } from "@/types";

interface Props {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export function OpportunityDetailSheet({ opportunity, onClose }: Props) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedOpportunityIds);
  const toggleSaved = useAppStore((s) => s.toggleSaved);
  const startApplication = useAppStore((s) => s.startApplication);
  const applications = useAppStore((s) => s.applications);
  const setMotivationLetter = useAppStore((s) => s.setMotivationLetter);
  const toggleDocument = useAppStore((s) => s.toggleDocument);
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);
  const pushNotification = useAppStore((s) => s.pushNotification);
  const openOpportunityDetail = useAppStore((s) => s.openOpportunityDetail);

  const [tab, setTab] = React.useState("why");
  const [letter, setLetter] = React.useState<string>("");
  const [drafting, setDrafting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const verdict: EligibilityVerdict | null = React.useMemo(
    () =>
      opportunity
        ? evaluateEligibility(profile, opportunity.id, opportunity.requirements)
        : null,
    [profile, opportunity]
  );

  const match: MatchScoreResult | null = React.useMemo(
    () => (opportunity ? calculateMatchScore(profile, opportunity) : null),
    [profile, opportunity]
  );

  // Existing tracked application for this opportunity
  const existingApp = React.useMemo(
    () =>
      opportunity
        ? applications.find((a) => a.opportunityId === opportunity.id)
        : null,
    [applications, opportunity]
  );

  React.useEffect(() => {
    setLetter(existingApp?.motivationLetter ?? "");
  }, [existingApp, opportunity?.id]);

  if (!opportunity || !verdict || !match) return null;

  const saved = savedIds.includes(opportunity.id);
  const deadline = formatDeadline(opportunity.deadline);

  const handleStartApplication = () => {
    if (existingApp) {
      openOpportunityDetail(null);
      window.location.href = `/applications?app=${existingApp.id}`;
    } else {
      const id = startApplication(opportunity.id);
      pushNotification({
        title: "Application started",
        description: `${opportunity.title} added to your tracker.`,
        variant: "success",
      });
      openOpportunityDetail(null);
      window.location.href = `/applications?app=${id}`;
    }
  };

  const handleDraftLetter = async () => {
    setDrafting(true);
    await delay(1200);
    const edu = profile.education?.[0];
    const exp = profile.experience?.[0];
    const drafted = `Dear ${opportunity.organizationName ?? "Selection Committee"},

I am writing to express my strong interest in the ${opportunity.title}. As a ${
      edu?.yearOfStudy ?? ""
    }${edu?.yearOfStudy ? "rd" : ""}-year ${edu?.major ?? "Computer Science"} student at ${
      edu?.institution ?? "my university"
    }, with a GPA of ${edu?.gpa?.toFixed(2) ?? "—"}/${
      edu?.gpaScale?.toFixed(1) ?? "4.0"
    }, I have developed a focused interest in ${
      profile.interests?.[0] ?? "technology and its societal impact"
    }.

During my ${
      exp ? `${exp.type} at ${exp.organization ?? "an organization"} as ${exp.title}` : "academic work"
    }, I gained hands-on experience in ${profile.skills?.slice(0, 3).join(", ") ?? "relevant technical areas"}. This experience reinforced my commitment to ${
      profile.goals?.[0] ?? "pursuing graduate study and contributing to research"
    }.

The ${opportunity.title} aligns directly with my goals because ${
      match.whyThisMatch[0] ?? "of its strong academic fit"
    }. I am confident that my background, combined with the opportunities this program offers, will allow me to contribute meaningfully and grow as a researcher and practitioner.

Thank you for considering my application. I look forward to the opportunity to discuss how my background fits your program.

Sincerely,
${profile.fullName}`;
    setLetter(drafted);
    if (existingApp) setMotivationLetter(existingApp.id, drafted);
    setDrafting(false);
    pushNotification({
      title: "Motivation letter drafted",
      description: "AI draft generated from your verified profile data. Edit freely.",
      variant: "success",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      pushNotification({ title: "Copied to clipboard", variant: "default" });
    } catch {
      pushNotification({ title: "Copy failed", variant: "error" });
    }
  };

  return (
    <Sheet open={!!opportunity} onClose={onClose} ariaLabel={opportunity.title}>
      <div className="h-full overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <MatchScoreRing score={match.totalScore} size={72} label="match" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <Badge variant="neutral" className="capitalize">
                  {opportunityTypeLabel(opportunity.type)}
                </Badge>
                <EligibilityBadge status={verdict.status} />
                <Badge variant="outline" className="capitalize">
                  {opportunity.field}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {opportunity.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {opportunity.organizationName}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span>{fundingLabel(opportunity.fundingType)}</span>
                <span>
                  {opportunity.locationCountry || "Worldwide"} ·{" "}
                  <span className="capitalize">{opportunity.locationMode.replace("_", " ")}</span>
                </span>
                <span
                  className={cn(
                    "font-medium",
                    deadline.isUrgent && !deadline.isPast && "text-amber-600 dark:text-amber-400",
                    deadline.isPast && "text-red-600"
                  )}
                >
                  {deadline.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button onClick={handleStartApplication}>
              <Play className="h-4 w-4" />
              {existingApp ? "Open in tracker" : "Start application"}
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleSaved(opportunity.id)}
              aria-pressed={saved}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </Button>
            {opportunity.applicationUrl && (
              <Button
                variant="ghost"
                onClick={() => window.open(opportunity.applicationUrl!, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Official page
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 pt-4 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10">
          <Tabs
            items={[
              { id: "why", label: "Why this match?" },
              { id: "rules", label: "Eligibility rules" },
              { id: "apply", label: "Apply", icon: <Sparkles className="h-3.5 w-3.5" /> },
            ]}
            activeId={tab}
            onChange={setTab}
          />
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* WHY TAB */}
          {tab === "why" && (
            <>
              <AIAssistPanel
                title="Why this match?"
                description="Based on your verified profile data — academics, skills, interests, and language."
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <MatchBar
                    label="Academics"
                    score={match.breakdown.academicsScore}
                    max={30}
                  />
                  <MatchBar label="Skills" score={match.breakdown.skillsScore} max={30} />
                  <MatchBar
                    label="Interests"
                    score={match.breakdown.interestsScore}
                    max={20}
                  />
                  <MatchBar
                    label="Language"
                    score={match.breakdown.languageScore}
                    max={20}
                  />
                </div>
                {match.whyThisMatch.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {match.whyThisMatch.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 mt-3">
                    Add more skills or interests to improve this match.
                  </p>
                )}
                {match.gapAnalysis.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-violet-200/60 dark:border-violet-500/20">
                    <div className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300 mb-2">
                      Suggestions
                    </div>
                    <ul className="space-y-1.5">
                      {match.gapAnalysis.recommendations.slice(0, 3).map((r, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-violet-500 mt-1 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AIAssistPanel>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  About this opportunity
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {opportunity.description}
                </p>
                {opportunity.highlights && opportunity.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {opportunity.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* RULES TAB */}
          {tab === "rules" && (
            <EligibilityRulesPanel
              verdict={verdict}
              requirements={opportunity.requirements ?? []}
            />
          )}

          {/* APPLY TAB */}
          {tab === "apply" && (
            <ApplicationAssistant
              opportunity={opportunity}
              existingApp={existingApp}
              letter={letter}
              drafting={drafting}
              copied={copied}
              onDraft={handleDraftLetter}
              onCopy={handleCopy}
              onLetterChange={(v) => {
                setLetter(v);
                if (existingApp) setMotivationLetter(existingApp.id, v);
              }}
              onToggleDoc={(doc) =>
                existingApp && toggleDocument(existingApp.id, doc.name)
              }
              onSubmit={() => {
                if (existingApp) {
                  updateApplicationStatus(existingApp.id, "submitted");
                  pushNotification({
                    title: "Application submitted",
                    description: "Good luck — we'll keep tracking this for you.",
                    variant: "success",
                  });
                }
              }}
              profile={profile}
            />
          )}
        </div>
      </div>
    </Sheet>
  );
}

function EligibilityRulesPanel({
  verdict,
  requirements,
}: {
  verdict: EligibilityVerdict;
  requirements: NonNullable<Opportunity["requirements"]>;
}) {
  return (
    <div className="space-y-5">
      {/* Eligibility verdict */}
      <div
        className={cn(
          "rounded-xl border p-4",
          verdict.status === "eligible" &&
            "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30",
          verdict.status === "likely_eligible" &&
            "bg-amber-50/60 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
          verdict.status === "unknown" &&
            "bg-slate-50 border-slate-200 dark:bg-slate-700/30 dark:border-slate-600",
          verdict.status === "not_eligible" &&
            "bg-red-50/60 border-red-200 dark:bg-red-500/10 dark:border-red-500/30"
        )}
      >
        <div className="flex items-start gap-3">
          <EligibilityBadge status={verdict.status} />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {verdict.summary}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Computed deterministically from the official requirements — never from AI.
            </div>
          </div>
        </div>
      </div>

      {/* Why not */}
      {verdict.whyNot && verdict.whyNot.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            Why not?
          </h3>
          <ul className="space-y-2">
            {verdict.whyNot.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm rounded-lg bg-red-50/60 border border-red-200 p-3 text-red-900 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200"
              >
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing info */}
      {verdict.missingInfo && verdict.missingInfo.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Needs more profile info
          </h3>
          <ul className="space-y-2">
            {verdict.missingInfo.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm rounded-lg bg-slate-50 border border-slate-200 p-3 text-slate-800 dark:bg-slate-700/40 dark:border-slate-600 dark:text-slate-200"
              >
                <CircleHelp className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full requirements checklist */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Requirement-by-requirement breakdown
        </h3>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {verdict.evaluations.map((e, i) => {
            const Icon = e.passed
              ? CheckCircle2
              : e.isUnknown
              ? CircleHelp
              : XCircle;
            const color = e.passed
              ? "text-emerald-600 dark:text-emerald-400"
              : e.isUnknown
              ? "text-slate-500 dark:text-slate-400"
              : "text-red-600 dark:text-red-400";
            return (
              <li
                key={i}
                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900"
              >
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {e.requirement.displayLabel}
                    </span>
                    {e.requirement.isMandatory && (
                      <Badge variant="outline" className="text-[10px]">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {e.reason}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {requirements.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No explicit restrictions specified.
          </p>
        )}
      </div>
    </div>
  );
}

function ApplicationAssistant({
  opportunity,
  existingApp,
  letter,
  drafting,
  copied,
  onDraft,
  onCopy,
  onLetterChange,
  onToggleDoc,
  onSubmit,
  profile,
}: {
  opportunity: Opportunity;
  existingApp: ReturnType<typeof useAppStore.getState>["applications"][number] | null | undefined;
  letter: string;
  drafting: boolean;
  copied: boolean;
  onDraft: () => void;
  onCopy: () => void;
  onLetterChange: (v: string) => void;
  onToggleDoc: (doc: { name: string; uploaded: boolean }) => void;
  onSubmit: () => void;
  profile: ReturnType<typeof useAppStore.getState>["profile"];
}) {
  // Auto-fill preview fields
  const edu = profile.education?.[0];
  const fields = [
    { label: "Full name", value: profile.fullName },
    { label: "Email", value: `${profile.fullName.toLowerCase().replace(/\s+/g, ".")}@example.edu` },
    { label: "Nationality", value: profile.nationality },
    { label: "Institution", value: edu?.institution },
    { label: "Major", value: edu?.major },
    { label: "GPA", value: edu?.gpa ? `${edu.gpa}/${edu.gpaScale ?? 4.0}` : "—" },
    {
      label: "Year",
      value: edu?.yearOfStudy ? `Year ${edu.yearOfStudy}` : "—",
    },
  ];

  const documents =
    existingApp?.documents && existingApp.documents.length > 0
      ? existingApp.documents
      : [
          { name: "CV / Resume", uploaded: false },
          { name: "Academic transcript", uploaded: false },
          { name: "Motivation letter", uploaded: false },
          { name: "Recommendation letter", uploaded: false },
        ];

  return (
    <div className="space-y-5">
      {/* Auto-fill preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Auto-fill from your profile
          </h3>
          <Badge variant="neutral">Reusable profile</Badge>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {fields.map((f, i) => (
            <div
              key={f.label}
              className={cn(
                "grid grid-cols-[140px_1fr] gap-3 px-4 py-2.5 text-sm",
                i % 2 === 1 && "bg-slate-50 dark:bg-slate-800/40",
                i !== 0 && "border-t border-slate-100 dark:border-slate-800"
              )}
            >
              <div className="text-slate-500 dark:text-slate-400">{f.label}</div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {f.value ?? "—"}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Fields auto-populate from your verified profile — edit your profile to update
          them everywhere.
        </p>
      </div>

      {/* AI-drafted motivation letter */}
      <AIAssistPanel
        title="Motivation letter — AI draft from your profile"
        description="Drafted using only the verified data in your profile. Edit freely before submitting."
        loading={drafting}
      >
        <Textarea
          value={letter}
          onChange={(e) => onLetterChange(e.target.value)}
          rows={10}
          placeholder="Click 'Draft with AI' to generate a starter from your profile, or write your own here."
          className="font-mono text-xs leading-relaxed bg-white dark:bg-slate-900"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button variant="ai" size="sm" onClick={onDraft} loading={drafting}>
            {!drafting && <Sparkles className="h-3.5 w-3.5" />}
            {drafting ? "Drafting…" : letter ? "Regenerate" : "Draft with AI"}
          </Button>
          <Button variant="outline" size="sm" onClick={onCopy} disabled={!letter}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <a
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            href={opportunity.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open official application <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        {letter && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <AIBadge label="AI draft" size="sm" />
            <span>Generated from profile data — review and edit before submitting.</span>
          </div>
        )}
      </AIAssistPanel>

      {/* Document checklist */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Document checklist
        </h3>
        <ul className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((d) => (
            <li
              key={d.name}
              className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900"
            >
              <FileText
                className={cn(
                  "h-4 w-4",
                  d.uploaded
                    ? "text-emerald-500"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                {d.name}
              </span>
              <button
                onClick={() => onToggleDoc(d)}
                aria-pressed={d.uploaded}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  d.uploaded
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {d.uploaded ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                  </>
                ) : (
                  "Mark uploaded"
                )}
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Mock upload — clicking "Mark uploaded" toggles the local flag.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        {existingApp && (
          <Button onClick={onSubmit}>
            <CheckCircle2 className="h-4 w-4" />
            Mark as submitted
          </Button>
        )}
      </div>

      {drafting && (
        <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Drafting from {profile.fullName}'s verified profile data…
        </div>
      )}
    </div>
  );
}
