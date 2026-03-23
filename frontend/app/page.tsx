"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  BookOpen,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Zap,
  Loader2,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  GraduationCap,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import CourseGrid from "../components/CourseGrid";
import CourseDetailModal from "../components/CourseDetailModal";
import AIExplanation from "../components/AIExplanation";
import YouTubeResources from "../components/YouTubeResources";
import {
  Course,
  Filters,
  SortOption,
  YouTubeResource,
  checkBackendHealth,
  fetchRecommendations,
  fetchSimilarCourses,
  fetchYouTubeResources,
  sortCourses,
  ApiError,
  TimeoutError,
  NetworkError,
  ServiceUnavailableError,
} from "@/services/api";
import config from "@/services/config";

const YOUTUBE_RESULT_CAP = 8;

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [similarCourses, setSimilarCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [isYouTubeLoading, setIsYouTubeLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasSimilarSearched, setHasSimilarSearched] = useState(false);
  const [youtubeResources, setYoutubeResources] = useState<YouTubeResource[]>([]);
  const [youtubeWarning, setYoutubeWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [similarHeading, setSimilarHeading] = useState("");
  const [dark, setDark] = useState(false);
  const [lastFilters, setLastFilters] = useState<Filters>({});
  const [lastTopK, setLastTopK] = useState(10);
  const [lastSort, setLastSort] = useState<SortOption>("relevance");
  const [lastQuery, setLastQuery] = useState("");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  const [courseRequestedCount, setCourseRequestedCount] = useState<number>(10);
  const [courseSourceCount, setCourseSourceCount] = useState<number>(0);
  const [youTubeRequestedCount, setYouTubeRequestedCount] = useState<number>(6);
  const [youTubeSourceCount, setYouTubeSourceCount] = useState<number>(0);

  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [backendRetryCount, setBackendRetryCount] = useState(0);
  const [backendConnectionError, setBackendConnectionError] = useState<string | null>(null);
  const [backendWarmingUp, setBackendWarmingUp] = useState(false);

  const similarRef = useRef<HTMLDivElement>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof TimeoutError) {
      return "Request timed out. The service may be busy. Please try again.";
    }
    if (err instanceof NetworkError) {
      return "Network error. Please check your connection and try again.";
    }
    if (err instanceof ServiceUnavailableError) {
      return "Recommendation engine is warming up. Please wait a moment and try again.";
    }
    if (err instanceof ApiError) {
      if (err.code === "INVALID_RESPONSE") {
        return "Server returned an unexpected response. Please try again.";
      }
      return err.message || "An error occurred. Please try again.";
    }
    if (err instanceof Error) {
      return err.message || "An error occurred. Please try again.";
    }
    return "An unexpected error occurred. Please try again.";
  };

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
      setBackendWarmingUp(false);

      let attempt = 0;
      while (!cancelled) {
        attempt += 1;
        const healthStatus = await checkBackendHealth();
        if (cancelled) return;

        if (healthStatus?.backend_ready) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          setBackendRetryCount(attempt - 1);
          setBackendConnectionError(null);
          setBackendWarmingUp(false);
          return;
        }

        if (healthStatus) {
          setBackendWarmingUp(true);
          setIsBackendReady(false);
          setBackendRetryCount(attempt);
        } else {
          setBackendWarmingUp(false);
          setIsBackendReady(false);
          setBackendRetryCount(attempt);
        }

        if (attempt >= config.maxHealthRetries) {
          setBackendConnectionError(
            "Unable to connect to the recommendation service. Please check if the backend is running."
          );
          setIsCheckingBackend(false);
          return;
        }

        await wait(config.healthCheckInterval);
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
      if (isCheckingBackend) {
        setError("Initializing AI Recommendation Engine. Please wait...");
      } else if (backendWarmingUp) {
        setError("Recommendation engine is warming up. Please wait a moment and try again.");
      } else {
        setError("Backend is not available. Please try again later.");
      }
      return;
    }

    setIsLoading(true);
    setIsYouTubeLoading(true);
    setError(null);
    setHasSearched(true);
    setSimilarCourses([]);
    setHasSimilarSearched(false);
    setLastFilters(filters);
    setLastTopK(topK);
    setLastSort(sort);
    setLastQuery(query);
    setResponseTime(null);
    setYoutubeResources([]);
    setYoutubeWarning(null);

    const requestedYouTube = Math.min(topK, YOUTUBE_RESULT_CAP);
    setCourseRequestedCount(topK);
    setYouTubeRequestedCount(requestedYouTube);

    const start = performance.now();

    try {
      const recommendationPromise = fetchRecommendations(query, filters, topK);
      const youtubePromise = fetchYouTubeResources(query, requestedYouTube);
      const [recommendationResult, youtubeResult] = await Promise.allSettled([
        recommendationPromise,
        youtubePromise,
      ]);

      if (recommendationResult.status === "fulfilled") {
        const data = recommendationResult.value;
        const filteredResults = applyClientFilters(data.results, filters, sort);
        const elapsed = Math.round(performance.now() - start);

        setResponseTime(elapsed);
        setCourseSourceCount(typeof data.count === "number" ? data.count : data.results.length);
        setCourses(filteredResults);

        if (filteredResults.length === 0) {
          setError("No courses found for your query. Try different keywords or broader filters.");
        }
      } else {
        setError(getErrorMessage(recommendationResult.reason));
        setCourseSourceCount(0);
        setCourses([]);
      }

      if (youtubeResult.status === "fulfilled") {
        const data = youtubeResult.value;
        const found = data.results.length;

        setYouTubeSourceCount(typeof data.count === "number" ? data.count : found);
        setYoutubeResources(data.results);

        if (found === 0) {
          setYoutubeWarning("No relevant YouTube videos found for this topic right now.");
        } else if (found < requestedYouTube) {
          setYoutubeWarning(`Only ${found} relevant YouTube videos were found for this topic.`);
        }
      } else {
        setYouTubeSourceCount(0);
        setYoutubeResources([]);
        setYoutubeWarning("Live YouTube resources are temporarily unavailable.");
      }
    } finally {
      setIsLoading(false);
      setIsYouTubeLoading(false);
    }
  };

  const handleFindSimilar = async (courseName: string) => {
    if (!isBackendReady) {
      if (isCheckingBackend) {
        setError("Initializing AI Recommendation Engine. Please wait...");
      } else if (backendWarmingUp) {
        setError("Recommendation engine is warming up. Please wait a moment and try again.");
      } else {
        setError("Backend is not available. Please try again later.");
      }
      return;
    }

    setIsSimilarLoading(true);
    setHasSimilarSearched(true);
    setSimilarHeading(`More courses like \"${courseName}\"`);
    setError(null);

    setTimeout(() => {
      similarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    try {
      const data = await fetchSimilarCourses(courseName, lastFilters, lastTopK);
      setSimilarCourses(applyClientFilters(data.results, lastFilters, lastSort));
      if (data.count === 0) {
        setError("No similar courses found. The selected course may not be in the retrieval index.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setSimilarCourses([]);
    } finally {
      setIsSimilarLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">LearnWise</h1>
              <p className="-mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">AI course intelligence for focused learning</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isBackendReady ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-300/55 bg-emerald-100/75 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                AI Engine Ready
              </div>
            ) : null}
            <button
              onClick={toggleDark}
              className="rounded-xl border border-slate-300/60 bg-white/70 p-2.5 text-slate-600 transition-colors duration-200 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 pb-10 pt-12 sm:pt-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="section-kicker mb-2">Premium AI Recommendation Platform</p>
            <h2 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Build your next skill path with curated courses and precise YouTube support
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              LearnWise combines structured course recommendations from Udemy and Coursera with live YouTube resources so you can learn faster with confidence.
            </p>
          </div>

          <div className="mx-auto mb-8 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-panel rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Primary Sources</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Udemy + Coursera</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Support Source</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Live YouTube Videos</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Flow</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Search → Evaluate → Start Learning</p>
            </div>
          </div>

          {!isBackendReady && isCheckingBackend && (
            <div className="mx-auto mb-4 max-w-4xl rounded-2xl border border-sky-300/40 bg-white/65 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-sky-800/55 dark:bg-slate-900/60">
              <div className="flex items-center gap-3 text-sky-700 dark:text-sky-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="text-sm font-medium sm:text-base">
                  {backendWarmingUp ? "Recommendation engine is warming up..." : "Initializing AI Recommendation Engine..."}
                </div>
              </div>
              <p className="mt-1 text-xs text-sky-700/80 dark:text-sky-300/80">
                {backendWarmingUp
                  ? "Loading retrieval index and model artifacts. Please wait a few seconds..."
                  : "Waiting for backend connection. Attempt: " + backendRetryCount}
              </p>
            </div>
          )}

          {backendConnectionError && (
            <div className="mx-auto mb-4 max-w-4xl rounded-2xl border border-red-200 bg-red-50/85 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{backendConnectionError}</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                The backend may still be starting up. Refresh after your backend service is healthy.
              </p>
            </div>
          )}

          <SearchBar onSearch={handleSearch} isLoading={isLoading} isBackendReady={isBackendReady} />
        </div>
      </section>

      {error && (
        <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 dark:border-red-900/55 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-10 px-4 pb-16 sm:px-6 lg:px-8">
        <CourseGrid
          courses={courses}
          onFindSimilar={handleFindSimilar}
          onOpenDetail={setDetailCourse}
          isLoading={isLoading}
          hasSearched={hasSearched}
          heading="Top Course Recommendations"
          query={lastQuery}
          responseTime={responseTime}
          requestedCount={courseRequestedCount}
          sourceCount={courseSourceCount}
          sourceLabel="Structured Course Index"
          emptyMessage="No high-confidence courses were found. Try broader keywords or fewer filters."
          showSimilarButton={false}
        />

        {hasSearched && !isLoading && courses.length > 0 && (
          <AIExplanation query={lastQuery} courses={courses} responseTime={responseTime} />
        )}

        <YouTubeResources
          resources={youtubeResources}
          isLoading={isYouTubeLoading}
          hasSearched={hasSearched}
          warning={youtubeWarning}
          requestedCount={youTubeRequestedCount}
          sourceCount={youTubeSourceCount}
        />

        <div ref={similarRef}>
          <CourseGrid
            courses={similarCourses}
            onFindSimilar={handleFindSimilar}
            onOpenDetail={setDetailCourse}
            isLoading={isSimilarLoading}
            hasSearched={hasSimilarSearched}
            heading={similarHeading || "Related Courses"}
            sourceLabel="Similarity Engine"
            emptyMessage="No similar courses were found for the selected result."
            showSimilarButton={false}
          />
        </div>
      </main>

      {!hasSearched && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                Icon: Sparkles,
                title: "AI-Powered Ranking",
                desc: "Semantic retrieval and relevance scoring prioritize what matters for your learning goal.",
              },
              {
                Icon: Layers,
                title: "Cross-Source Discovery",
                desc: "Blend structured courses with live YouTube context to quickly compare and decide.",
              },
              {
                Icon: Zap,
                title: "Fast Decision Flow",
                desc: "From query to action in seconds with confidence indicators and clean result structure.",
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="product-card rounded-2xl px-5 py-5 backdrop-blur-xl dark:bg-slate-900/55"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-teal-500/20 text-sky-600 dark:text-sky-300">
                  <feature.Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{feature.desc}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/50 bg-white/70 px-3 py-1.5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <BookOpen className="h-4 w-4 text-sky-500" />
              Trusted course catalogs
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/50 bg-white/70 px-3 py-1.5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <PlayCircle className="h-4 w-4 text-rose-500" />
              Live YouTube support
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/50 bg-white/70 px-3 py-1.5 dark:border-slate-700/70 dark:bg-slate-900/60">
              <ArrowRight className="h-4 w-4 text-teal-500" />
              Clear recommendation flow
            </span>
          </div>
        </section>
      )}

      <CourseDetailModal course={detailCourse} onClose={() => setDetailCourse(null)} />
    </div>
  );
}
