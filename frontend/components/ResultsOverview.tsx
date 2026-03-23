"use client";

import { BarChart3, Clock3, Compass, Sparkles, Youtube, BookOpen } from "lucide-react";

type Confidence = "high" | "medium" | "low";

type PrimarySource = "youtube" | "courses";

interface ResultsOverviewProps {
  query: string;
  responseTime: number | null;
  primarySource: PrimarySource;
  courseCount: number;
  youtubeCount: number;
  courseConfidence: Confidence;
  youtubeConfidence: Confidence;
  summary: string;
  honestyNote?: string;
}

function confidenceBadge(confidence: Confidence): string {
  if (confidence === "high") {
    return "border-emerald-300/60 bg-emerald-100/70 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (confidence === "medium") {
    return "border-amber-300/60 bg-amber-100/70 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "border-rose-300/60 bg-rose-100/70 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-300";
}

export default function ResultsOverview({
  query,
  responseTime,
  primarySource,
  courseCount,
  youtubeCount,
  courseConfidence,
  youtubeConfidence,
  summary,
  honestyNote,
}: ResultsOverviewProps) {
  return (
    <section className="glass-panel overflow-hidden rounded-3xl border px-5 py-5 sm:px-6 sm:py-6">
      <div className="absolute pointer-events-none" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/50 bg-sky-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-800/55 dark:bg-sky-900/30 dark:text-sky-300">
          <Compass className="h-3.5 w-3.5" />
          Results Intelligence
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/60 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-300">
          <Clock3 className="h-3.5 w-3.5" />
          {responseTime != null ? `${responseTime}ms` : "Live"}
        </span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        Best matches for <span className="text-sky-700 dark:text-sky-300">&ldquo;{query}&rdquo;</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">{summary}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/75 bg-white/70 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/60">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Primary source</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {primarySource === "youtube" ? "YouTube has stronger relevance" : "Structured courses are strongest"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/75 bg-white/70 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Structured courses</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceBadge(courseConfidence)}`}>
              {courseConfidence} confidence
            </span>
          </div>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <BookOpen className="h-4 w-4 text-sky-500" />
            {courseCount} matches
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/75 bg-white/70 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">YouTube results</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceBadge(youtubeConfidence)}`}>
              {youtubeConfidence} confidence
            </span>
          </div>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Youtube className="h-4 w-4 text-rose-500" />
            {youtubeCount} matches
          </p>
        </div>
      </div>

      {honestyNote ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/85 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="inline-flex items-start gap-1.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            {honestyNote}
          </p>
        </div>
      ) : null}

      <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <BarChart3 className="h-3.5 w-3.5" />
        Ranking combines semantic similarity, keyword relevance, and source quality confidence.
      </div>
    </section>
  );
}
