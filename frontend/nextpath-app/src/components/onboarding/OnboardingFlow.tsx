"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, GraduationCap, Languages, Briefcase, Heart, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AIBadge } from "@/components/shared/EligibilityBadge";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { EducationLevel, OnboardingDraft } from "@/types";

const STEPS = [
  { id: "identity", label: "Identity", icon: User },
  { id: "academics", label: "Academics", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "interests", label: "Interests & goals", icon: Heart },
];

interface Props {
  onComplete: () => void;
  onCancel?: () => void;
}

const emptyDraft: OnboardingDraft = {
  fullName: "",
  nationality: "Egyptian",
  countryOfResidence: "Egypt",
  age: undefined,
  bio: "",
  education: {
    institution: "",
    degreeLevel: "bachelor",
    major: "",
    yearOfStudy: undefined,
    gpa: undefined,
    gpaScale: 4.0,
    graduationYear: undefined,
    isCurrent: true,
  },
  skills: [],
  languages: [
    { name: "Arabic", proficiency: "native" },
  ],
  experience: [],
  interests: [],
  goals: [],
};

export function OnboardingFlow({ onComplete, onCancel }: Props) {
  const profile = useAppStore((s) => s.profile);
  const saveOnboardingDraft = useAppStore((s) => s.saveOnboardingDraft);
  const pushNotification = useAppStore((s) => s.pushNotification);

  const [draft, setDraft] = React.useState<OnboardingDraft>(() => ({
    ...emptyDraft,
    fullName: profile.fullName,
    nationality: profile.nationality,
    countryOfResidence: profile.countryOfResidence ?? "Egypt",
    age: profile.age,
    bio: profile.bio ?? "",
    education: profile.education?.[0]
      ? { ...profile.education[0], gpaScale: profile.education[0].gpaScale ?? 4.0 }
      : emptyDraft.education,
    skills: profile.skills ?? [],
    languages: profile.languages ?? emptyDraft.languages,
    experience: profile.experience ?? [],
    interests: profile.interests ?? [],
    goals: profile.goals ?? [],
  }));
  const [stepIdx, setStepIdx] = React.useState(0);
  const step = STEPS[stepIdx];
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const update = <K extends keyof OnboardingDraft>(k: K, v: OnboardingDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx((i) => i + 1);
    else {
      saveOnboardingDraft(draft);
      pushNotification({
        title: "Profile saved",
        description: "We'll re-rank your opportunities against the updated profile.",
        variant: "success",
      });
      onComplete();
    }
  };
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  return (
    <Card className="p-6 md:p-8">
      {/* Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Step {stepIdx + 1} of {STEPS.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {Math.round(progress)}% complete
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-4 flex flex-wrap gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
                  active
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                {s.label}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step body */}
      <div className="space-y-5">
        {step.id === "identity" && (
          <div className="space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Tell us who you are
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We use this only to match you against opportunity eligibility rules.
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fn">Full name</Label>
                <Input
                  id="fn"
                  value={draft.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Yara Hassan"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={15}
                  max={70}
                  value={draft.age ?? ""}
                  onChange={(e) =>
                    update("age", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nat">Nationality</Label>
                <Input
                  id="nat"
                  value={draft.nationality}
                  onChange={(e) => update("nationality", e.target.value)}
                  placeholder="Egyptian"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country of residence</Label>
                <Input
                  id="country"
                  value={draft.countryOfResidence}
                  onChange={(e) => update("countryOfResidence", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                rows={3}
                value={draft.bio ?? ""}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="One sentence about yourself."
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step.id === "academics" && (
          <div className="space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Academic background
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This is checked directly against each opportunity's GPA and degree rules.
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inst">Institution</Label>
                <Input
                  id="inst"
                  value={draft.education.institution}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      education: { ...d.education, institution: e.target.value },
                    }))
                  }
                  placeholder="Cairo University"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={draft.education.major}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      education: { ...d.education, major: e.target.value },
                    }))
                  }
                  placeholder="Computer Science"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="level">Degree level</Label>
                <select
                  id="level"
                  value={draft.education.degreeLevel}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      education: {
                        ...d.education,
                        degreeLevel: e.target.value as EducationLevel,
                      },
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="high_school">High school</option>
                  <option value="bachelor">Bachelor's</option>
                  <option value="master">Master's</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div>
                <Label htmlFor="year">Year of study</Label>
                <Input
                  id="year"
                  type="number"
                  min={1}
                  max={8}
                  value={draft.education.yearOfStudy ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      education: {
                        ...d.education,
                        yearOfStudy: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step={0.01}
                  min={0}
                  max={draft.education.gpaScale ?? 4.0}
                  value={draft.education.gpa ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      education: {
                        ...d.education,
                        gpa: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="scale">GPA scale</Label>
                <select
                  id="scale"
                  value={draft.education.gpaScale ?? 4.0}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      education: { ...d.education, gpaScale: Number(e.target.value) },
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value={4}>4.0</option>
                  <option value={5}>5.0</option>
                  <option value={10}>10.0</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step.id === "skills" && (
          <div className="space-y-4">
            <header>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Skills
                </h2>
                <AIBadge label="Used by match engine" size="sm" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Skills are matched against opportunity descriptions to boost your score.
              </p>
            </header>
            <TagEditor
              tags={draft.skills}
              onChange={(skills) => update("skills", skills)}
              placeholder="Type a skill and press Enter (e.g. Python, React, ML)"
            />
          </div>
        )}

        {step.id === "languages" && (
          <div className="space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Languages
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Including an official English test (IELTS / TOEFL) unlocks most international
                scholarships.
              </p>
            </header>
            <div className="space-y-3">
              {draft.languages.map((lang, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900"
                >
                  <Input
                    value={lang.name}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        languages: d.languages.map((l, j) =>
                          j === i ? { ...l, name: e.target.value } : l
                        ),
                      }))
                    }
                    placeholder="Language"
                  />
                  <select
                    value={lang.proficiency}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        languages: d.languages.map((l, j) =>
                          j === i
                            ? {
                                ...l,
                                proficiency: e.target
                                  .value as typeof lang.proficiency,
                              }
                            : l
                        ),
                      }))
                    }
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="native">Native</option>
                    <option value="fluent">Fluent</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="basic">Basic</option>
                  </select>
                  <select
                    value={lang.testName ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        languages: d.languages.map((l, j) =>
                          j === i
                            ? {
                                ...l,
                                testName: (e.target.value || undefined) as
                                  | "IELTS"
                                  | "TOEFL"
                                  | "Duolingo"
                                  | undefined,
                              }
                            : l
                        ),
                      }))
                    }
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">No test</option>
                    <option value="IELTS">IELTS</option>
                    <option value="TOEFL">TOEFL</option>
                    <option value="Duolingo">Duolingo</option>
                  </select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step={0.1}
                      value={lang.testScore ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          languages: d.languages.map((l, j) =>
                            j === i
                              ? {
                                  ...l,
                                  testScore: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                }
                              : l
                          ),
                        }))
                      }
                      placeholder="Score"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          languages: d.languages.filter((_, j) => j !== i),
                        }))
                      }
                      aria-label="Remove language"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    languages: [
                      ...d.languages,
                      { name: "", proficiency: "intermediate" },
                    ],
                  }))
                }
              >
                + Add language
              </Button>
            </div>
          </div>
        )}

        {step.id === "experience" && (
          <div className="space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Experience
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add internships, research, volunteering, projects, or jobs. Each entry counts
                as one experience record.
              </p>
            </header>
            <div className="space-y-3">
              {draft.experience.map((exp, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-900"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={exp.type}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          experience: d.experience.map((x, j) =>
                            j === i
                              ? { ...x, type: e.target.value as typeof x.type }
                              : x
                          ),
                        }))
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm capitalize dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="internship">Internship</option>
                      <option value="research">Research</option>
                      <option value="volunteering">Volunteering</option>
                      <option value="project">Project</option>
                      <option value="work">Work</option>
                    </select>
                    <Input
                      value={exp.title}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          experience: d.experience.map((x, j) =>
                            j === i ? { ...x, title: e.target.value } : x
                          ),
                        }))
                      }
                      placeholder="Title (e.g. ML Intern)"
                    />
                    <Input
                      value={exp.organization ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          experience: d.experience.map((x, j) =>
                            j === i ? { ...x, organization: e.target.value } : x
                          ),
                        }))
                      }
                      placeholder="Organization"
                    />
                  </div>
                  <Textarea
                    rows={2}
                    value={exp.description ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        experience: d.experience.map((x, j) =>
                          j === i ? { ...x, description: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Short description"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          experience: d.experience.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    experience: [
                      ...d.experience,
                      { type: "internship", title: "" },
                    ],
                  }))
                }
              >
                + Add experience
              </Button>
            </div>
          </div>
        )}

        {step.id === "interests" && (
          <div className="space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Interests & goals
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Used to find opportunities that align with what you actually want to work on.
              </p>
            </header>
            <div>
              <Label>Interests</Label>
              <TagEditor
                tags={draft.interests}
                onChange={(interests) => update("interests", interests)}
                placeholder="AI, Climate Tech, Education Access…"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Goals</Label>
              <TagEditor
                tags={draft.goals}
                onChange={(goals) => update("goals", goals)}
                placeholder="Pursue a Master's in ML, Build an ed-tech startup…"
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary preview if last step */}
      {stepIdx === STEPS.length - 1 && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Ready to save
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {draft.fullName || "Your profile"} · {draft.nationality} · {draft.education.major || "Major"} ·{" "}
                {draft.skills.length} skills · {draft.languages.length} languages
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={stepIdx === 0 ? onCancel : prev}>
          <ArrowLeft className="h-4 w-4" />
          {stepIdx === 0 ? "Cancel" : "Back"}
        </Button>
        <Button onClick={next}>
          {stepIdx === STEPS.length - 1 ? "Save profile" : "Next"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function TagEditor({
  tags,
  onChange,
  placeholder,
  className,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  className?: string;
}) {
  const [input, setInput] = React.useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <Badge key={t} variant="indigo" className="gap-1 pr-1">
            {t}
            <button
              aria-label={`Remove ${t}`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="ml-1 rounded-full hover:bg-indigo-200/60 dark:hover:bg-indigo-500/30 inline-flex items-center justify-center w-4 h-4"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
