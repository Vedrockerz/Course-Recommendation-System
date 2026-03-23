"use client";

import { SearchX, Info, Database } from "lucide-react";
import { Course } from "@/services/api";
import CourseCard from "./CourseCard";

interface CourseGridProps {
  courses: Course[];
  onFindSimilar: (courseName: string) => void;
  onOpenDetail: (course: Course) => void;
  isLoading: boolean;
  hasSearched: boolean;
  heading?: string;
  query?: string;
  responseTime?: number | null;
  showSimilarButton?: boolean;
  requestedCount?: number;
  sourceCount?: number;
  sourceLabel?: string;
  emptyMessage?: string;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/75 shadow-md backdrop-blur-md animate-pulse dark:border-slate-800/70 dark:bg-slate-900/65">
      <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="absolute left-3 top-3 h-5 w-16 rounded-lg bg-slate-300 dark:bg-slate-700" />
        <div className="absolute right-3 top-3 h-5 w-12 rounded-lg bg-slate-300 dark:bg-slate-700" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-[92%] rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-3.5 w-[68%] rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/60" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/70 px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/35 dark:text-sky-400">
        <SearchX className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No course results found</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

function CountExplanation({
  requestedCount,
  sourceCount,
  shownCount,
}: {
  requestedCount?: number;
  sourceCount?: number;
  shownCount: number;
}) {
  if (!requestedCount && sourceCount == null) return null;

  const requested = requestedCount ?? shownCount;
  const source = sourceCount ?? shownCount;

  if (source < requested) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Requested {requested}, but only {source} highly relevant courses were returned.
      </p>
    );
  }

  if (shownCount < source) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl border border-slate-300/70 bg-slate-100/80 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Showing {shownCount} of {source} results after filters.
      </p>
    );
  }

  return null;
}

export default function CourseGrid({
  courses,
  onFindSimilar,
  onOpenDetail,
  isLoading,
  hasSearched,
  heading,
  query,
  responseTime,
  showSimilarButton = true,
  requestedCount,
  sourceCount,
  sourceLabel,
  emptyMessage = "Try broader keywords such as machine learning, data science, or web development.",
}: CourseGridProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (!hasSearched) return null;
  if (courses.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <section>
      <div className="glass-panel mb-6 rounded-2xl px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-slate-300/60 bg-white/65 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-300">
              <Database className="h-3.5 w-3.5" />
              {sourceLabel || "Structured Recommendations"}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{heading || "Top Course Recommendations"}</h2>
            {query ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Query: <span className="font-semibold text-sky-700 dark:text-sky-300">{query}</span>
              </p>
            ) : null}
            <CountExplanation requestedCount={requestedCount} sourceCount={sourceCount} shownCount={courses.length} />
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {courses.length} {courses.length === 1 ? "course" : "courses"} shown
            </p>
            {responseTime != null ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Response time: {responseTime}ms</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => (
          <CourseCard
            key={`${course.course_title}-${index}`}
            course={course}
            onFindSimilar={onFindSimilar}
            onOpenDetail={onOpenDetail}
            showSimilarButton={showSimilarButton}
          />
        ))}
      </div>
    </section>
  );
}
