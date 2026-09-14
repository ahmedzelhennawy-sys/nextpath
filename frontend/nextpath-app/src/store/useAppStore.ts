"use client";

import { create } from "zustand";
import {
  ApplicationStatus,
  FilterState,
  OnboardingDraft,
  StudentProfile,
  Theme,
  ToastNotification,
  TrackedApplication,
} from "@/types";
import {
  initialApplications,
  opportunities as seedOpportunities,
  sampleProfile,
} from "@/data/mockData";
import { uid } from "@/lib/utils";

interface AppState {
  // Profile
  profile: StudentProfile;
  onboardingComplete: boolean;
  setProfile: (profile: StudentProfile) => void;
  setOnboardingComplete: (v: boolean) => void;
  saveOnboardingDraft: (draft: OnboardingDraft) => void;
  // Opportunities
  savedOpportunityIds: string[];
  toggleSaved: (id: string) => void;
  // Applications
  applications: TrackedApplication[];
  startApplication: (opportunityId: string) => string;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateApplication: (id: string, patch: Partial<TrackedApplication>) => void;
  setMotivationLetter: (id: string, letter: string) => void;
  toggleDocument: (appId: string, docName: string) => void;
  // Filters
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;
  // UI
  theme: Theme;
  toggleTheme: () => void;
  notifications: ToastNotification[];
  pushNotification: (n: Omit<ToastNotification, "id">) => void;
  dismissNotification: (id: string) => void;
  detailOpportunityId: string | null;
  openOpportunityDetail: (id: string | null) => void;
  // Hydration
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

const defaultFilters: FilterState = {
  query: "",
  types: [],
  fundingTypes: [],
  locationMode: [],
  minMatchScore: 0,
  sort: "match",
};

export const useAppStore = create<AppState>((set) => ({
  profile: sampleProfile,
  onboardingComplete: true,
  setProfile: (profile) => set({ profile }),
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),
  saveOnboardingDraft: (draft) =>
    set({
      profile: {
        id: sampleProfile.id,
        fullName: draft.fullName || sampleProfile.fullName,
        nationality: draft.nationality,
        countryOfResidence: draft.countryOfResidence,
        age: draft.age,
        bio: draft.bio,
        education: [
          {
            institution: draft.education.institution,
            degreeLevel: draft.education.degreeLevel,
            major: draft.education.major,
            yearOfStudy: draft.education.yearOfStudy,
            gpa: draft.education.gpa,
            gpaScale: draft.education.gpaScale ?? 4.0,
            graduationYear: draft.education.graduationYear,
            isCurrent: draft.education.isCurrent ?? true,
          },
        ],
        skills: draft.skills,
        languages: draft.languages,
        experience: draft.experience,
        interests: draft.interests,
        goals: draft.goals,
      },
      onboardingComplete: true,
    }),

  savedOpportunityIds: ["opp-003", "opp-008"],
  toggleSaved: (id) =>
    set((s) => ({
      savedOpportunityIds: s.savedOpportunityIds.includes(id)
        ? s.savedOpportunityIds.filter((x) => x !== id)
        : [...s.savedOpportunityIds, id],
    })),

  applications: initialApplications,
  startApplication: (opportunityId) => {
    const id = uid("app");
    const opp = seedOpportunities.find((o) => o.id === opportunityId);
    const docs = opp?.highlights?.map((h) => ({ name: h, uploaded: false })) ?? [
      { name: "CV", uploaded: false },
      { name: "Motivation Letter", uploaded: false },
    ];
    set((s) => ({
      applications: [
        ...s.applications,
        {
          id,
          opportunityId,
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: docs,
        },
      ],
    }));
    return id;
  },
  updateApplicationStatus: (id, status) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      ),
    })),
  updateApplication: (id, patch) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id
          ? { ...a, ...patch, updatedAt: new Date().toISOString() }
          : a
      ),
    })),
  setMotivationLetter: (id, letter) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id
          ? { ...a, motivationLetter: letter, updatedAt: new Date().toISOString() }
          : a
      ),
    })),
  toggleDocument: (appId, docName) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId
          ? {
              ...a,
              documents: a.documents?.map((d) =>
                d.name === docName ? { ...d, uploaded: !d.uploaded } : d
              ),
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    })),

  filters: defaultFilters,
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: defaultFilters }),

  theme: "light",
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  notifications: [],
  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: uid("toast"), durationMs: 3500, ...n },
      ],
    })),
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  detailOpportunityId: null,
  openOpportunityDetail: (id) => set({ detailOpportunityId: id }),

  hydrated: false,
  setHydrated: (v) => set({ hydrated: v }),
}));
