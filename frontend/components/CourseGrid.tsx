"use client";

import { SearchX, Loader2 } from "lucide-react";
import { Course } from "@/services/api";
import CourseCard from "./CourseCard";

interface CourseGridProps {
  courses: Course[];
  onFindSimilar: (courseName: string) => void;
  isLoading: boolean;
  hasSearched: boolean;
  heading?: string;
  showSimilarButton?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3 py-4">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Finding the best courses for you...
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden shadow-md
                       bg-white dark:bg-gray-900
                       border border-gray-200/80 dark:border-gray-800
                       animate-pulse"
          >
            <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-4/5" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-3/5" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-14 bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg mt-1" />
            </div>
          </div>
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
  isLoading,
  hasSearched,
  heading,
  showSimilarButton = true,
}: CourseGridProps) {
  if (isLoading) return <LoadingSkeleton />;

  if (hasSearched && courses.length === 0) return <EmptyState />;

  if (!hasSearched) return null;

  return (
    <div>
      {heading && (
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{heading}</h2>
          <span className="ml-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course, index) => (
          <CourseCard
            key={`${course.course_title}-${index}`}
            course={course}
            onFindSimilar={onFindSimilar}
            showSimilarButton={showSimilarButton}
          />
        ))}
      </div>
    </div>
  );
}
