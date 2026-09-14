import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ToastHost } from "@/components/shared/ToastHost";

export const metadata: Metadata = {
  title: "NEXTPATH — Opportunity intelligence for students",
  description:
    "Find scholarships, internships, hackathons, research programs, and more — with rule-based eligibility verdicts and AI assist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <ToastHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
