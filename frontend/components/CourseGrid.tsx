"use client";

import { SearchX } from "lucide-react";
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
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden
                    bg-white/70 dark:bg-gray-900/70 backdrop-blur-md
                    border border-gray-200/60 dark:border-gray-800/60
                    shadow-md animate-pulse">
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-100
                      dark:from-gray-800 dark:to-gray-850 relative">
        <div className="absolute top-3 left-3 h-5 w-16 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        <div className="absolute top-3 right-3 h-5 w-12 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        <div className="absolute bottom-3 left-3 h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded-md" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-[90%]" />
        <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-lg w-[60%]" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl mt-2" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 mb-6 rounded-2xl
                      bg-gradient-to-br from-indigo-100 to-purple-100
                      dark:from-indigo-900/40 dark:to-purple-900/40
                      flex items-center justify-center shadow-inner">
        <SearchX className="h-10 w-10 text-indigo-400 dark:text-indigo-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        No courses found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed">
        Try a different search term like &ldquo;machine learning&rdquo;,
        &ldquo;web development&rdquo;, or &ldquo;data science&rdquo;.
      </p>
    </div>
  );
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
}: CourseGridProps) {
  if (isLoading) return <LoadingSkeleton />;

  if (hasSearched && courses.length === 0) return <EmptyState />;

  if (!hasSearched) return null;

  return (
    <div>
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {heading || "Recommended Courses"}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:ml-1">
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
            {query && (
              <span> for <span className="text-indigo-600 dark:text-indigo-400 font-semibold">&apos;{query}&apos;</span></span>
            )}
          </span>
          {responseTime != null && (
            <span className="text-xs text-gray-400 dark:text-gray-600">
              · {responseTime}ms
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
