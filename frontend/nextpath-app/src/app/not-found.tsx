"use client";

import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container py-20 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Compass className="h-6 w-6 text-slate-500" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        That opportunity hasn't been discovered yet.
      </p>
      <a
        href="/"
        className="inline-block mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
      >
        Back to Discover
      </a>
    </div>
  );
}
