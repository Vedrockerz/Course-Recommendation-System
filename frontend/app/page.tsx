"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BookOpen, Sun, Moon, Sparkles, Layers, Zap, Loader2, CheckCircle2 } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CourseGrid from "@/components/CourseGrid";
import CourseDetailModal from "@/components/CourseDetailModal";
import AIExplanation from "@/components/AIExplanation";
import {
  Course, Filters, SortOption,
  checkBackendHealth, fetchRecommendations, fetchSimilarCourses, sortCourses,
} from "@/services/api";

const HEALTH_CHECK_INTERVAL_MS = 1000;
const MAX_HEALTH_RETRIES = 30;

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
  const [lastTopK, setLastTopK] = useState(10);
  const [lastSort, setLastSort] = useState<SortOption>("relevance");
  const [lastQuery, setLastQuery] = useState("");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [backendRetryCount, setBackendRetryCount] = useState(0);
  const [backendConnectionError, setBackendConnectionError] = useState<string | null>(null);

  const similarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const checkBackendUntilReady = async () => {
      setIsCheckingBackend(true);
      setBackendConnectionError(null);

      let attempt = 0;
      while (!cancelled) {
        attempt += 1;
        const healthy = await checkBackendHealth();
        if (cancelled) return;

        if (healthy) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          setBackendRetryCount(attempt - 1);
          setBackendConnectionError(null);
          return;
        }

        setBackendRetryCount(attempt);

        if (attempt >= MAX_HEALTH_RETRIES) {
          setBackendConnectionError("Unable to connect to AI recommendation service.");
        }

        await wait(HEALTH_CHECK_INTERVAL_MS);
      }
    };

    void checkBackendUntilReady();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  const applyClientFilters = useCallback((results: Course[], filters: Filters, sort: SortOption): Course[] => {
    let filtered = results;
    if (filters.platform) {
      filtered = filtered.filter((c) => c.platform === filters.platform);
    }
    return sortCourses(filtered, sort);
  }, []);

  const handleSearch = async (query: string, filters: Filters, topK: number, sort: SortOption) => {
    if (!isBackendReady) {
      setError("Initializing AI Recommendation Engine...");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSimilarCourses([]);
    setHasSimilarSearched(false);
    setLastFilters(filters);
    setLastTopK(topK);
    setLastSort(sort);
    setLastQuery(query);
    setResponseTime(null);

    const start = performance.now();
    try {
      const data = await fetchRecommendations(query, filters, topK);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setCourses(applyClientFilters(data.results, filters, sort));
    } catch {
      setError("Failed to fetch recommendations. Make sure the backend is running.");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSimilar = async (courseName: string) => {
    if (!isBackendReady) {
      setError("Initializing AI Recommendation Engine...");
      return;
    }

    setIsSimilarLoading(true);
    setHasSimilarSearched(true);
    setSimilarHeading(`Courses similar to "${courseName}"`);
    setError(null);

    setTimeout(() => {
      similarRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const data = await fetchSimilarCourses(courseName, lastFilters, lastTopK);
      setSimilarCourses(applyClientFilters(data.results, lastFilters, lastSort));
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
                         bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl
                         border-gray-200/80 dark:border-gray-800/80 transition-colors">
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
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Find the{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Perfect Course
            </span>{" "}
            for You
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Powered by AI to recommend the best courses from Udemy, Coursera, and
            more. Just type what you want to learn.
          </p>

          {isBackendReady && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5
                            bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">AI Engine Ready</span>
            </div>
          )}
        </div>

        {!isBackendReady && isCheckingBackend && (
          <div className="max-w-3xl mx-auto mb-4 rounded-2xl border border-indigo-200/70 dark:border-indigo-700/40
                          bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-3 text-indigo-700 dark:text-indigo-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="text-sm sm:text-base font-medium">Initializing AI Recommendation Engine...</div>
            </div>
            <p className="mt-1 text-xs text-indigo-600/80 dark:text-indigo-300/80">
              Waiting for backend readiness. Retry attempt: {backendRetryCount}
            </p>
          </div>
        )}

        {backendConnectionError && (
          <div className="max-w-3xl mx-auto mb-4 rounded-2xl border border-red-200 dark:border-red-800/50
                          bg-red-50/80 dark:bg-red-900/20 px-4 py-3.5">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{backendConnectionError}</p>
          </div>
        )}

        <SearchBar onSearch={handleSearch} isLoading={isLoading} isBackendReady={isBackendReady} />
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
        <CourseGrid
          courses={courses}
          onFindSimilar={handleFindSimilar}
          onOpenDetail={setDetailCourse}
          isLoading={isLoading}
          hasSearched={hasSearched}
          heading={hasSearched && courses.length > 0 ? "Recommended Courses" : undefined}
          query={lastQuery}
          responseTime={responseTime}
          showSimilarButton={false}
        />

        {/* AI Explanation */}
        {hasSearched && !isLoading && courses.length > 0 && (
          <AIExplanation query={lastQuery} courses={courses} responseTime={responseTime} />
        )}

        <div ref={similarRef}>
          <CourseGrid
            courses={similarCourses}
            onFindSimilar={handleFindSimilar}
            onOpenDetail={setDetailCourse}
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
                className="group/card rounded-2xl p-6 border
                           bg-white/60 dark:bg-gray-900/50 backdrop-blur-md
                           border-gray-100 dark:border-gray-800
                           shadow-sm hover:shadow-xl dark:hover:shadow-black/30
                           hover:-translate-y-1
                           transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mb-4
                                group-hover/card:scale-110 transition-transform duration-300">
                  <f.Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Course Detail Modal ── */}
      <CourseDetailModal course={detailCourse} onClose={() => setDetailCourse(null)} />
    </div>
  );
}
