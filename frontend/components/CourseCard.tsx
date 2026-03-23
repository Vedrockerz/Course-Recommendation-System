"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ExternalLink, Copy, Clock, BarChart3, Users, Bookmark, BookmarkCheck, Zap } from "lucide-react";
import { Course } from "@/services/api";

interface CourseCardProps {
  course: Course;
  onFindSimilar: (courseName: string) => void;
  onOpenDetail: (course: Course) => void;
  showSimilarButton?: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop";

const platformStyles: Record<string, string> = {
  Udemy: "bg-violet-500/90 text-white",
  Coursera: "bg-sky-500/90 text-white",
  edX: "bg-rose-500/90 text-white",
};

const levelStyles: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
  "All Levels": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <div key={i} className="relative w-3.5 h-3.5">
            <Star className="w-3.5 h-3.5 text-gray-200 dark:text-gray-700" fill="currentColor" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default function CourseCard({
  course,
  onFindSimilar,
  onOpenDetail,
  showSimilarButton = true,
}: CourseCardProps) {
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const platformClass = platformStyles[course.platform] || "bg-gray-500/90 text-white";
  const levelClass = levelStyles[course.level] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  const imageSrc = !imgError && course.image ? course.image : FALLBACK_IMAGE;
  const matchPct = course.similarity_score != null ? Math.round(course.similarity_score * 100) : null;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl
                 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md
                 border border-gray-200/60 dark:border-gray-800/60
                 shadow-md hover:shadow-2xl dark:shadow-black/20 dark:hover:shadow-black/50
                 hover:-translate-y-1.5 hover:scale-[1.01]
                 transition-all duration-300 ease-out cursor-pointer"
      onClick={() => onOpenDetail(course)}
    >
      {/* ── Image ── */}
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Image
          src={imageSrc}
          alt={course.course_title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Platform badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase backdrop-blur-sm shadow-sm ${platformClass}`}>
          {course.platform}
        </span>

        {/* Rating badge */}
        <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-1 rounded-lg
                        bg-black/50 backdrop-blur-sm text-white text-xs font-bold shadow-sm">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          {course.rating?.toFixed(1) ?? "N/A"}
        </div>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); setBookmarked((b) => !b); }}
          className="absolute top-3 right-3 p-1.5 rounded-lg
                     bg-black/40 backdrop-blur-sm text-white
                     hover:bg-black/60 transition-all duration-200"
          title={bookmarked ? "Remove bookmark" : "Bookmark course"}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Match % badge */}
        {matchPct != null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg
                          bg-gradient-to-r from-emerald-500 to-teal-500
                          text-white text-xs font-bold shadow-md">
            <Zap className="w-3 h-3" />
            {matchPct}% Match
          </div>
        )}

        {/* Level badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${levelClass}`}>
            {course.level}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">

        {/* Title */}
        <h3
          className="text-[15px] font-bold leading-snug line-clamp-2
                     text-gray-900 dark:text-gray-50
                     group-hover:text-indigo-600 dark:group-hover:text-indigo-400
                     transition-colors duration-200"
          title={course.course_title}
        >
          {course.course_title}
        </h3>

        {/* Stars + student count */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-amber-500 dark:text-amber-400">
            {course.rating?.toFixed(1) ?? "—"}
          </span>
          <StarRating rating={course.rating ?? 0} />
          <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 ml-1">
            <Users className="w-3 h-3" />
            {formatCount(course.reviewcount ?? 0)} students
          </span>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold
                           bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Clock className="w-3 h-3" />
            {course.duration_category} · {course.duration_hours?.toFixed(1) ?? "?"}h
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold
                           bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <BarChart3 className="w-3 h-3" />
            {course.level}
          </span>
        </div>

        {/* ── Buttons ── */}
        <div className="mt-auto pt-3 flex flex-col gap-2">
          {course.course_url && (
            <a
              href={course.course_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                         hover:from-indigo-600 hover:to-purple-700
                         shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30
                         dark:shadow-indigo-900/30 dark:hover:shadow-indigo-900/50
                         transition-all duration-200 active:scale-[0.97]"
            >
              <ExternalLink className="w-4 h-4" />
              View Course
            </a>
          )}
          {showSimilarButton && (
            <button
              onClick={(e) => { e.stopPropagation(); onFindSimilar(course.course_title); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                         bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         border border-gray-200 dark:border-gray-700
                         hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300
                         dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 dark:hover:border-indigo-800
                         transition-all duration-200 active:scale-[0.97]"
            >
              <Copy className="w-4 h-4" />
              Find Similar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
