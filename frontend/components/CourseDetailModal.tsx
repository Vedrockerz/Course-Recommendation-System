"use client";

import { useEffect, useRef } from "react";
import {
  X, Star, ExternalLink, Clock, Users, BarChart3, Zap, BookOpen,
} from "lucide-react";
import { Course } from "@/services/api";

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
}

const platformColors: Record<string, string> = {
  Udemy: "from-violet-500 to-purple-600",
  Coursera: "from-sky-500 to-blue-600",
  edX: "from-rose-500 to-red-600",
};

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default function CourseDetailModal({ course, onClose }: CourseDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!course) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [course, onClose]);

  if (!course) return null;

  const gradient = platformColors[course.platform] || "from-gray-500 to-gray-600";
  const matchPct = course.similarity_score != null ? Math.round(course.similarity_score * 100) : null;

  // Parse metadata for topics if available
  const metadata = course.metadata || "";
  const topics = metadata
    ? metadata.split(/[,;|]/).map((t) => t.trim()).filter((t) => t.length > 2 && t.length < 80).slice(0, 8)
    : [];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm
                 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
                   bg-white dark:bg-gray-900
                   rounded-2xl shadow-2xl dark:shadow-black/50
                   border border-gray-200 dark:border-gray-800
                   animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl
                     bg-black/30 backdrop-blur-sm text-white
                     hover:bg-black/50 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header gradient */}
        <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute bottom-4 left-6 right-16">
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-white bg-white/20 backdrop-blur-sm mb-2">
              {course.platform}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {course.course_title}
          </h2>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {course.rating?.toFixed(1) ?? "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="font-medium">{formatCount(course.reviewcount ?? 0)} students enrolled</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {course.duration_hours?.toFixed(1) ?? "?"} hours · {course.duration_category}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">{course.level}</span>
            </div>

            {matchPct != null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                              bg-emerald-50 dark:bg-emerald-900/30
                              text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                <Zap className="w-4 h-4" />
                {matchPct}% AI Match
              </div>
            )}
          </div>

          {/* Description from metadata */}
          {metadata && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                About this course
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {metadata.length > 500 ? metadata.slice(0, 500) + "…" : metadata}
              </p>
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Course Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {topics.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg text-xs font-medium
                               bg-indigo-50 text-indigo-700
                               dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {course.course_url && (
              <a
                href={course.course_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                           bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                           hover:from-indigo-600 hover:to-purple-700
                           shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30
                           transition-all duration-200 active:scale-[0.97]"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Course
              </a>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                         bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         border border-gray-200 dark:border-gray-700
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
