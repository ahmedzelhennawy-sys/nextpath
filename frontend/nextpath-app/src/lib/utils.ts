// Utilities
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function formatDeadline(deadline?: string): {
  label: string;
  daysLeft: number | null;
  isPast: boolean;
  isUrgent: boolean;
} {
  if (!deadline) return { label: "Rolling", daysLeft: null, isPast: false, isUrgent: false };
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return { label: deadline, daysLeft: null, isPast: false, isUrgent: false };
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Closed", daysLeft: days, isPast: true, isUrgent: false };
  if (days === 0) return { label: "Closes today", daysLeft: 0, isPast: false, isUrgent: true };
  if (days === 1) return { label: "1 day left", daysLeft: 1, isPast: false, isUrgent: true };
  if (days <= 7) return { label: `${days} days left`, daysLeft: days, isPast: false, isUrgent: true };
  const month = d.toLocaleString("en-US", { month: "short" });
  return { label: `${month} ${d.getDate()} · ${days}d`, daysLeft: days, isPast: false, isUrgent: false };
}

export function fundingLabel(fundingType?: string): string {
  switch (fundingType) {
    case "fully_funded":
      return "Fully funded";
    case "partial":
      return "Partial funding";
    case "paid":
      return "Paid";
    case "free":
      return "Free";
    case "fee_required":
      return "Fee required";
    case "unpaid":
      return "Unpaid";
    default:
      return "Funding varies";
  }
}

export function eligibilityLabel(status: string): string {
  switch (status) {
    case "eligible":
      return "Eligible";
    case "likely_eligible":
      return "Likely eligible";
    case "unknown":
      return "Needs info";
    case "not_eligible":
      return "Not eligible";
    default:
      return status;
  }
}

export function opportunityTypeLabel(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
