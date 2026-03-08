"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, Sun, Moon, Sparkles, Layers, Zap } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CourseGrid from "@/components/CourseGrid";
import { Course, Filters, fetchRecommendations, fetchSimilarCourses } from "@/services/api";

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [similarCourses, setSimilarCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasSimilarSearched, setHasSimilarSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarHeading, setSimilarHeading] = useState("");
  const [dark, setDark] = useState(false);
  const [lastFilters, setLastFilters] = useState<Filters>({});

  const similarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleSearch = async (query: string, filters: Filters) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSimilarCourses([]);
    setHasSimilarSearched(false);
    setLastFilters(filters);
    try {
      const data = await fetchRecommendations(query, filters);
      setCourses(data.results);
    } catch {
      setError("Failed to fetch recommendations. Make sure the backend is running.");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSimilar = async (courseName: string) => {
    setIsSimilarLoading(true);
    setHasSimilarSearched(true);
    setSimilarHeading(`Courses similar to "${courseName}"`);
    setError(null);

    setTimeout(() => {
      similarRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const data = await fetchSimilarCourses(courseName, lastFilters);
      setSimilarCourses(data.results);
    } catch {
      setError("Failed to fetch similar courses. Please try again.");
      setSimilarCourses([]);
    } finally {
      setIsSimilarLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20
                    dark:from-gray-950 dark:via-gray-950 dark:to-gray-900
                    transition-colors duration-300">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b
                         bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl
                         border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Course Recommendation System
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 -mt-0.5">
                Discover your next learning journey
              </p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl
                       bg-gray-100 dark:bg-gray-800
                       text-gray-600 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-700
                       transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-16 pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Find the{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Perfect Course
            </span>{" "}
            for You
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powered by AI to recommend the best courses from Udemy, Coursera, and
            more. Just type what you want to learn.
          </p>
        </div>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-xl p-4 flex items-center gap-3
                          bg-red-50 dark:bg-red-900/20
                          border border-red-200 dark:border-red-800/50">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">
        <CourseGrid
          courses={courses}
          onFindSimilar={handleFindSimilar}
          isLoading={isLoading}
          hasSearched={hasSearched}
          heading={hasSearched && courses.length > 0 ? "Recommended Courses" : undefined}
          showSimilarButton={true}
        />
        <div ref={similarRef}>
          <CourseGrid
            courses={similarCourses}
            onFindSimilar={handleFindSimilar}
            isLoading={isSimilarLoading}
            hasSearched={hasSimilarSearched}
            heading={similarHeading}
            showSimilarButton={false}
          />
        </div>
      </main>

      {/* ── Features (before search) ── */}
      {!hasSearched && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { Icon: Sparkles, title: "AI-Powered", desc: "Smart recommendations using advanced embedding models and similarity search" },
              { Icon: Layers, title: "Multi-Platform", desc: "Courses from Udemy, Coursera, and other top learning platforms" },
              { Icon: Zap, title: "Instant Results", desc: "Get personalized course recommendations in milliseconds" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 border shadow-sm
                           bg-white/70 dark:bg-gray-900/60 backdrop-blur
                           border-gray-100 dark:border-gray-800
                           hover:shadow-md dark:hover:shadow-black/30
                           transition-shadow duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mb-4">
                  <f.Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
