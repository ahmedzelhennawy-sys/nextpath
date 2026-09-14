"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  FileCheck2,
  User,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/shared/Avatar";

const navItems = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/applications", label: "My Applications", icon: FileCheck2 },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme, profile, applications } = useAppStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const pendingCount = applications.filter(
    (a) => a.status === "submitted" || a.status === "decision_pending"
  ).length;
  const inProgressCount = applications.filter(
    (a) => a.status === "in_progress" || a.status === "not_started"
  ).length;

  // Close menus on route change
  React.useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="container flex h-16 items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 mr-2">
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-soft">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 19L19 5M9 5h10v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                NEXTPATH
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Opportunity intelligence
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.href === "/applications" && inProgressCount > 0 && (
                    <Badge variant="indigo" className="ml-1">
                      {inProgressCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen((v) => !v);
                setUserMenuOpen(false);
              }}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-800 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Deadline reminders
                  </h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingCount === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500 text-center">
                      No active reminders.
                    </p>
                  ) : (
                    applications
                      .filter((a) => a.status !== "accepted" && a.status !== "rejected")
                      .slice(0, 4)
                      .map((a) => (
                        <div
                          key={a.id}
                          className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Application {a.id.slice(-4)}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Status:{" "}
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              {a.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              aria-label="User menu"
              onClick={() => {
                setUserMenuOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Avatar name={profile.fullName} size="sm" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-800 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {profile.fullName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {profile.nationality} · {profile.education?.[0]?.major}
                  </div>
                </div>
                <div className="p-1">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    View profile
                  </Link>
                  <Link
                    href="/gap"
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Profile gap analysis
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1 container py-6 md:py-8">{children}</main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            NEXTPATH · AI does <strong>not</strong> decide eligibility.
          </div>
          <div className="flex items-center gap-3">
            <span>Built with deterministic rule-based verdicts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
