"use client";

import * as React from "react";
import {
  Edit3,
  GraduationCap,
  Languages,
  Briefcase,
  Heart,
  Sparkles,
  Globe,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/shared/Avatar";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function ProfileView() {
  const profile = useAppStore((s) => s.profile);
  const [editing, setEditing] = React.useState(false);

  const edu = profile.education?.[0];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Your profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verified data feeds the eligibility engine and the match score. Edit any time.
          </p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit3 className="h-4 w-4" />
            Edit profile
          </Button>
        )}
      </header>

      {editing ? (
        <OnboardingFlow onComplete={() => setEditing(false)} onCancel={() => setEditing(false)} />
      ) : (
        <>
          {/* Header card */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar name={profile.fullName} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {profile.fullName}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {profile.nationality}
                  {profile.countryOfResidence && ` · ${profile.countryOfResidence}`}
                  {profile.age && ` · Age ${profile.age}`}
                </p>
                {profile.bio && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                {profile.goals && profile.goals.length > 0 && (
                  <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-3 dark:border-violet-500/30 dark:bg-violet-500/5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      Goals
                    </div>
                    <ul className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                      {profile.goals.map((g, i) => (
                        <li key={i}>• {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Academics */}
            <Card className="p-5">
              <SectionHeader icon={GraduationCap} title="Academics" />
              {edu ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">Institution</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {edu.institution}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">Degree</div>
                      <div className="font-medium capitalize text-slate-900 dark:text-slate-100">
                        {edu.degreeLevel.replace("_", " ")}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">Major</div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {edu.major}
                      </div>
                    </div>
                    {edu.yearOfStudy && (
                      <div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">Year</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          Year {edu.yearOfStudy}
                        </div>
                      </div>
                    )}
                    {edu.gpa !== undefined && (
                      <div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">GPA</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {edu.gpa.toFixed(2)} / {edu.gpaScale?.toFixed(1) ?? "4.0"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                  No education added yet.
                </p>
              )}
            </Card>

            {/* Skills */}
            <Card className="p-5">
              <SectionHeader icon={Sparkles} title="Skills" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills?.map((s) => (
                  <Badge key={s} variant="indigo">
                    {s}
                  </Badge>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <span className="text-sm text-slate-500">None added</span>
                )}
              </div>
            </Card>

            {/* Languages */}
            <Card className="p-5">
              <SectionHeader icon={Languages} title="Languages" />
              <ul className="mt-3 space-y-2">
                {profile.languages?.map((l, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {l.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" className="capitalize">
                        {l.proficiency}
                      </Badge>
                      {l.testName && l.testScore !== undefined && (
                        <Badge variant="ai">
                          {l.testName} {l.testScore}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
                {(!profile.languages || profile.languages.length === 0) && (
                  <li className="text-sm text-slate-500">None added</li>
                )}
              </ul>
            </Card>

            {/* Experience */}
            <Card className="p-5">
              <SectionHeader icon={Briefcase} title="Experience" />
              <ul className="mt-3 space-y-3">
                {profile.experience?.map((e, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="neutral" className="capitalize">
                        {e.type}
                      </Badge>
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {e.title}
                      </span>
                    </div>
                    {e.organization && (
                      <div className="text-xs text-slate-500 mt-1">{e.organization}</div>
                    )}
                    {e.description && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {e.description}
                      </div>
                    )}
                  </li>
                ))}
                {(!profile.experience || profile.experience.length === 0) && (
                  <li className="text-sm text-slate-500">None added</li>
                )}
              </ul>
            </Card>

            {/* Interests */}
            <Card className="p-5 md:col-span-2">
              <SectionHeader icon={Heart} title="Interests" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.interests?.map((i) => (
                  <Badge key={i} variant="ai">
                    {i}
                  </Badge>
                ))}
                {(!profile.interests || profile.interests.length === 0) && (
                  <span className="text-sm text-slate-500">None added</span>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
    </div>
  );
}
