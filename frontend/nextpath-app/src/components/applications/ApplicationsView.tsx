"use client";

import * as React from "react";
import {
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Input";
import { AIBadge } from "@/components/shared/EligibilityBadge";
import { AIAssistPanel } from "@/components/shared/AIAssistPanel";
import { useAppStore } from "@/store/useAppStore";
import { opportunities } from "@/data/mockData";
import { cn, formatDeadline, eligibilityLabel } from "@/lib/utils";
import type {
  ApplicationStatus,
  TrackedApplication,
  EligibilityVerdict,
} from "@/types";
import { evaluateEligibility } from "@/lib/eligibility";

const STATUSES: {
  id: ApplicationStatus;
  label: string;
  color: string;
}[] = [
  { id: "not_started", label: "Not started", color: "slate" },
  { id: "in_progress", label: "In progress", color: "indigo" },
  { id: "submitted", label: "Submitted", color: "amber" },
  { id: "decision_pending", label: "Decision pending", color: "violet" },
  { id: "accepted", label: "Accepted", color: "emerald" },
  { id: "rejected", label: "Rejected", color: "red" },
];

export function ApplicationsView({ focusedAppId }: { focusedAppId?: string }) {
  const applications = useAppStore((s) => s.applications);
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);
  const pushNotification = useAppStore((s) => s.pushNotification);
  const [view, setView] = React.useState<"kanban" | "table">("kanban");
  const [openId, setOpenId] = React.useState<string | null>(focusedAppId ?? null);

  React.useEffect(() => {
    if (focusedAppId) setOpenId(focusedAppId);
  }, [focusedAppId]);

  const byStatus = React.useMemo(() => {
    const map: Record<ApplicationStatus, TrackedApplication[]> = {
      not_started: [],
      in_progress: [],
      submitted: [],
      decision_pending: [],
      accepted: [],
      rejected: [],
    };
    for (const a of applications) map[a.status].push(a);
    return map;
  }, [applications]);

  const stats = {
    total: applications.length,
    inProgress: byStatus.in_progress.length + byStatus.not_started.length,
    pendingDecision: byStatus.submitted.length + byStatus.decision_pending.length,
    decided: byStatus.accepted.length + byStatus.rejected.length,
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            My applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track every opportunity you've saved or started, with deadlines and missing docs.
          </p>
        </div>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg",
              view === "kanban"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg",
              view === "table"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300"
            )}
          >
            <TableIcon className="h-3.5 w-3.5" />
            Table
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="In progress" value={stats.inProgress} tone="indigo" />
        <Stat label="Awaiting decision" value={stats.pendingDecision} tone="amber" />
        <Stat label="Decided" value={stats.decided} tone="emerald" />
      </div>

      {view === "kanban" ? (
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-w-[1024px]">
            {STATUSES.map((s) => (
              <KanbanColumn
                key={s.id}
                status={s.id}
                label={s.label}
                color={s.color}
                apps={byStatus[s.id]}
                onOpen={(id) => setOpenId(id)}
                onChangeStatus={(id, status) => {
                  updateApplicationStatus(id, status);
                  pushNotification({
                    title: "Status updated",
                    description: `Moved to ${eligibilityLabel(status).toLowerCase()}.`,
                    variant: "default",
                  });
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <ApplicationsTable
          applications={applications}
          onOpen={(id) => setOpenId(id)}
          onChangeStatus={(id, status) => updateApplicationStatus(id, status)}
        />
      )}

      <ApplicationDetailSheet
        id={openId}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "indigo" | "amber" | "emerald";
}) {
  const styles = {
    neutral: "border-slate-200 dark:border-slate-700",
    indigo: "border-indigo-200 bg-indigo-50/40 dark:border-indigo-500/30 dark:bg-indigo-500/5",
    amber: "border-amber-200 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5",
    emerald: "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5",
  };
  return (
    <Card className={cn("p-4", styles[tone])}>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
        {value}
      </div>
    </Card>
  );
}

function KanbanColumn({
  status,
  label,
  color,
  apps,
  onOpen,
  onChangeStatus,
}: {
  status: ApplicationStatus;
  label: string;
  color: string;
  apps: TrackedApplication[];
  onOpen: (id: string) => void;
  onChangeStatus: (id: string, s: ApplicationStatus) => void;
}) {
  return (
    <div className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-2 min-h-[200px] border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              color === "slate" && "bg-slate-400",
              color === "indigo" && "bg-indigo-500",
              color === "amber" && "bg-amber-500",
              color === "violet" && "bg-violet-500",
              color === "emerald" && "bg-emerald-500",
              color === "red" && "bg-red-500"
            )}
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </span>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">{apps.length}</span>
      </div>
      <div className="space-y-2">
        {apps.length === 0 ? (
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
            —
          </div>
        ) : (
          apps.map((a) => (
            <KanbanCard
              key={a.id}
              app={a}
              onOpen={() => onOpen(a.id)}
              onChangeStatus={(s) => onChangeStatus(a.id, s)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  app,
  onOpen,
  onChangeStatus,
}: {
  app: TrackedApplication;
  onOpen: () => void;
  onChangeStatus: (s: ApplicationStatus) => void;
}) {
  const opp = opportunities.find((o) => o.id === app.opportunityId);
  const deadline = opp ? formatDeadline(opp.deadline) : null;
  const missingDocs = app.documents?.filter((d) => !d.uploaded).length ?? 0;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-lg bg-white dark:bg-slate-900 p-3 shadow-soft border border-slate-200 dark:border-slate-700 hover:shadow-elevated transition-all"
    >
      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
        {opp?.title ?? "Unknown opportunity"}
      </div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
        {opp?.organizationName}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[11px] flex-wrap">
        {deadline && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium",
              deadline.isUrgent && !deadline.isPast
                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                : deadline.isPast
                ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            )}
          >
            <Calendar className="h-3 w-3" />
            {deadline.label}
          </span>
        )}
        {missingDocs > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 font-medium">
            <FileText className="h-3 w-3" />
            {missingDocs} missing
          </span>
        )}
      </div>
      <select
        value={app.status}
        onChange={(e) => {
          e.stopPropagation();
          onChangeStatus(e.target.value as ApplicationStatus);
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 h-7 w-full text-[10px] rounded-md border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
      >
        {STATUSES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </button>
  );
}

function ApplicationsTable({
  applications,
  onOpen,
  onChangeStatus,
}: {
  applications: TrackedApplication[];
  onOpen: (id: string) => void;
  onChangeStatus: (id: string, s: ApplicationStatus) => void;
}) {
  const [sortBy, setSortBy] = React.useState<"deadline" | "status" | "updated">(
    "deadline"
  );

  const rows = React.useMemo(() => {
    const enriched = applications.map((a) => {
      const opp = opportunities.find((o) => o.id === a.opportunityId);
      const deadline = opp ? formatDeadline(opp.deadline) : null;
      const missingDocs = a.documents?.filter((d) => !d.uploaded).length ?? 0;
      return { app: a, opp, deadline, missingDocs };
    });
    return enriched.sort((a, b) => {
      if (sortBy === "deadline") {
        const da = a.opp?.deadline
          ? new Date(a.opp.deadline).getTime()
          : Number.MAX_SAFE_INTEGER;
        const db = b.opp?.deadline
          ? new Date(b.opp.deadline).getTime()
          : Number.MAX_SAFE_INTEGER;
        return da - db;
      }
      if (sortBy === "updated") {
        return new Date(b.app.updatedAt).getTime() - new Date(a.app.updatedAt).getTime();
      }
      return a.app.status.localeCompare(b.app.status);
    });
  }, [applications, sortBy]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {rows.length} applications
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="deadline">Deadline</option>
            <option value="updated">Last updated</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Opportunity</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold">Deadline</th>
              <th className="text-left px-4 py-2.5 font-semibold">Documents</th>
              <th className="text-left px-4 py-2.5 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map(({ app, opp, deadline, missingDocs }) => (
              <tr
                key={app.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                onClick={() => onOpen(app.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                    {opp?.title ?? "—"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {opp?.organizationName}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      app.status === "accepted"
                        ? "eligible"
                        : app.status === "rejected"
                        ? "ineligible"
                        : app.status === "submitted" || app.status === "decision_pending"
                        ? "likely"
                        : app.status === "in_progress"
                        ? "ai"
                        : "neutral"
                    }
                    className="capitalize"
                  >
                    {app.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {deadline ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        deadline.isUrgent && !deadline.isPast
                          ? "text-amber-600 dark:text-amber-400"
                          : deadline.isPast
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {deadline.label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {missingDocs === 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                      <AlertCircle className="h-3.5 w-3.5" /> {missingDocs} missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(app.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ApplicationDetailSheet({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const application = useAppStore((s) =>
    id ? s.applications.find((a) => a.id === id) ?? null : null
  );
  const profile = useAppStore((s) => s.profile);
  const setMotivationLetter = useAppStore((s) => s.setMotivationLetter);
  const toggleDocument = useAppStore((s) => s.toggleDocument);
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);
  const pushNotification = useAppStore((s) => s.pushNotification);
  const [letter, setLetter] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (application?.motivationLetter !== undefined) setLetter(application.motivationLetter);
    else setLetter("");
  }, [application?.id, application?.motivationLetter]);

  const opp = application ? opportunities.find((o) => o.id === application.opportunityId) : null;
  const verdict: EligibilityVerdict | null = opp
    ? evaluateEligibility(profile, opp.id, opp.requirements)
    : null;

  if (!application || !opp) return null;

  const handleDraft = async () => {
    setDrafting(true);
    await new Promise((r) => setTimeout(r, 1100));
    const edu = profile.education?.[0];
    const exp = profile.experience?.[0];
    const drafted = `Dear ${opp.organizationName ?? "Selection Committee"},

I am writing to express my strong interest in the ${opp.title}. As a ${
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
      profile.goals?.[0] ?? "pursuing graduate study"
    }.

The ${opp.title} aligns directly with my goals. I am confident that my background, combined with the opportunities this program offers, will allow me to contribute meaningfully and grow as a researcher and practitioner.

Thank you for considering my application.

Sincerely,
${profile.fullName}`;
    setLetter(drafted);
    setMotivationLetter(application.id, drafted);
    setDrafting(false);
    pushNotification({
      title: "Motivation letter drafted",
      description: "AI draft generated from your verified profile.",
      variant: "success",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    pushNotification({ title: "Copied to clipboard" });
  };

  return (
    <Sheet open={!!id} onClose={onClose} ariaLabel="Application detail">
      <div className="h-full overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3 flex-wrap">
            <Badge variant="neutral" className="capitalize">
              {opp.type.replace("_", " ")}
            </Badge>
            {verdict && (
              <Badge
                variant={
                  verdict.status === "eligible"
                    ? "eligible"
                    : verdict.status === "likely_eligible"
                    ? "likely"
                    : verdict.status === "not_eligible"
                    ? "ineligible"
                    : "neutral"
                }
              >
                {eligibilityLabel(verdict.status)}
              </Badge>
            )}
            <Badge variant="outline">{opp.field}</Badge>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {opp.title}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{opp.organizationName}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status controls */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Current status
                </div>
                <div className="text-sm font-semibold capitalize mt-0.5">
                  {application.status.replace(/_/g, " ")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={application.status}
                  onChange={(e) =>
                    updateApplicationStatus(application.id, e.target.value as ApplicationStatus)
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {opp.applicationUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(opp.applicationUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Official
                  </Button>
                )}
              </div>
            </div>
            {application.notes && (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                {application.notes}
              </div>
            )}
          </Card>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Document checklist
            </h3>
            <ul className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {(application.documents ?? []).map((d) => (
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
                    onClick={() => toggleDocument(application.id, d.name)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
                      d.uploaded
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    )}
                  >
                    {d.uploaded ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" /> Mark uploaded
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Letter */}
          <AIAssistPanel
            title="Motivation letter"
            description="AI-drafted from your profile. Edit freely before submitting."
            loading={drafting}
          >
            <Textarea
              rows={10}
              value={letter}
              onChange={(e) => {
                setLetter(e.target.value);
                setMotivationLetter(application.id, e.target.value);
              }}
              placeholder="Click 'Draft with AI' to generate a starter."
              className="font-mono text-xs leading-relaxed bg-white dark:bg-slate-900"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="ai" size="sm" onClick={handleDraft} loading={drafting}>
                {!drafting && <Sparkles className="h-3.5 w-3.5" />}
                {letter ? "Regenerate" : "Draft with AI"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!letter}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </AIAssistPanel>

          {/* Submit CTA */}
          <div className="flex gap-2 pt-2">
            {application.status !== "submitted" && application.status !== "accepted" && (
              <Button
                onClick={() => {
                  updateApplicationStatus(application.id, "submitted");
                  pushNotification({
                    title: "Application submitted",
                    description: "Good luck — we'll track the deadline for you.",
                    variant: "success",
                  });
                }}
              >
                <ArrowRight className="h-4 w-4" />
                Mark as submitted
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
