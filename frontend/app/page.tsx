"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import ResultsOverview from "../components/ResultsOverview";
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

type Confidence = "high" | "medium" | "low";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenizeQuery(query: string): string[] {
  const normalized = normalizeText(query);
  const tokens = normalized.split(" ").filter((token) => token.length >= 2);
  return Array.from(new Set(tokens));
}

function keywordCoverage(tokens: string[], text: string): number {
  if (tokens.length === 0) return 0;
  const normalizedText = normalizeText(text);
  if (!normalizedText) return 0;

  const matched = tokens.filter((token) => normalizedText.includes(token)).length;
  return clamp01(matched / tokens.length);
}

function aggregateTopScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => b - a).slice(0, 4);
  const weights = [1, 0.78, 0.62, 0.5];
  const weighted = sorted.reduce((sum, score, index) => sum + score * weights[index], 0);
  const totalWeight = weights.slice(0, sorted.length).reduce((sum, weight) => sum + weight, 0);
  return totalWeight > 0 ? clamp01(weighted / totalWeight) : 0;
}

function estimateCourseQuality(courses: Course[], query: string): number {
  if (courses.length === 0) return 0;
  const tokens = tokenizeQuery(query);

  const perItemScores = courses.slice(0, 8).map((course) => {
    const relevanceText = `${course.course_title || ""} ${course.metadata || ""}`;
    const lexical = keywordCoverage(tokens, relevanceText);
    const simScore = typeof course.similarity_score === "number" ? clamp01(course.similarity_score) : lexical * 0.55;
    const ratingScore = clamp01((course.rating ?? 0) / 5);
    const popularityScore = clamp01(Math.log10((course.reviewcount ?? 0) + 1) / 6);

    return clamp01(simScore * 0.58 + lexical * 0.27 + ratingScore * 0.1 + popularityScore * 0.05);
  });

  return aggregateTopScores(perItemScores);
}

function estimateYouTubeQuality(resources: YouTubeResource[], query: string): number {
  if (resources.length === 0) return 0;
  const tokens = tokenizeQuery(query);

  const perItemScores = resources.slice(0, 8).map((resource) => {
    const relevanceText = `${resource.title || ""} ${resource.description || ""} ${resource.channel_title || ""}`;
    const lexical = keywordCoverage(tokens, relevanceText);

    let freshness = 0.55;
    if (resource.published_date) {
      const ts = new Date(resource.published_date).getTime();
      if (!Number.isNaN(ts)) {
        const yearsOld = (Date.now() - ts) / (1000 * 60 * 60 * 24 * 365);
        freshness = clamp01(1 - yearsOld / 6);
      }
    }

    const channelScore = resource.channel_title ? 0.9 : 0.5;
    return clamp01(lexical * 0.74 + freshness * 0.16 + channelScore * 0.1);
  });

  return aggregateTopScores(perItemScores);
}

function confidenceFromScore(score: number): Confidence {
  if (score >= 0.68) return "high";
  if (score >= 0.48) return "medium";
  return "low";
}

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

  const resultIntelligence = useMemo(() => {
    const courseQuality = estimateCourseQuality(courses, lastQuery);
    const youtubeQuality = estimateYouTubeQuality(youtubeResources, lastQuery);
    const courseConfidence = confidenceFromScore(courseQuality);
    const youtubeConfidence = confidenceFromScore(youtubeQuality);

    const hasCourses = courses.length > 0;
    const hasYouTube = youtubeResources.length > 0;

    const youtubeStronger =
      hasYouTube &&
      (!hasCourses || youtubeQuality > courseQuality + 0.08 || (courseConfidence === "low" && youtubeConfidence !== "low"));

    const primarySource: "youtube" | "courses" = youtubeStronger ? "youtube" : "courses";

    const summary = youtubeStronger
      ? "YouTube currently has the strongest relevance for this query, so we surface those matches first and then show structured course options."
      : "Structured course matches are currently strongest, so course options are shown first with YouTube resources as supporting material.";

    let honestyNote: string | undefined;
    if (hasYouTube && (courseConfidence === "low" || !hasCourses) && youtubeConfidence !== "low") {
      honestyNote = `No high-confidence structured course matches were found for \"${lastQuery}\". YouTube currently has the strongest relevant results for this topic.`;
    } else if (!hasYouTube && hasCourses) {
      honestyNote = "Live YouTube results are limited for this query right now. Structured course options are prioritized.";
    }

    const courseHeading =
      courseConfidence === "high" && !youtubeStronger
        ? "Top Course Recommendations"
        : courseConfidence === "medium"
          ? "Structured Course Options"
          : "Lower-confidence Course Matches";

    const courseSubtitle =
      courseConfidence === "high"
        ? "High relevance structured courses from Udemy and Coursera."
        : courseConfidence === "medium"
          ? "Useful structured courses found, but relevance is mixed for this exact query."
          : `No high-confidence structured course matches found for \"${lastQuery}\".`;

    const courseStatusMessage =
      courseConfidence === "low" && hasYouTube
        ? "YouTube currently has stronger relevance for this topic. Explore related structured options below."
        : undefined;

    const youtubeHeading = youtubeStronger ? "Top Matches" : "Best YouTube Resources";
    const youtubeDescription = youtubeStronger
      ? "YouTube currently provides the strongest relevant matches for this query."
      : "Targeted video resources that complement your structured course options.";

    const youtubeStatusMessage =
      youtubeConfidence === "high" && youtubeStronger
        ? "These videos show strong query relevance and are prioritized first."
        : youtubeConfidence === "low"
          ? "Live YouTube relevance is limited for this query right now."
          : undefined;

    return {
      courseQuality,
      youtubeQuality,
      courseConfidence,
      youtubeConfidence,
      primarySource,
      summary,
      honestyNote,
      courseHeading,
      courseSubtitle,
      courseStatusMessage,
      youtubeHeading,
      youtubeDescription,
      youtubeStatusMessage,
    };
  }, [courses, youtubeResources, lastQuery]);

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

  const renderCourseSection = (
    <CourseGrid
      courses={courses}
      onFindSimilar={handleFindSimilar}
      onOpenDetail={setDetailCourse}
      isLoading={isLoading}
      hasSearched={hasSearched}
      heading={resultIntelligence.courseHeading}
      subtitle={resultIntelligence.courseSubtitle}
      statusMessage={resultIntelligence.courseStatusMessage}
      query={lastQuery}
      responseTime={responseTime}
      requestedCount={courseRequestedCount}
      sourceCount={courseSourceCount}
      sourceLabel="Structured Course Index"
      emptyMessage="No high-confidence courses were found. Try broader keywords or fewer filters."
      showSimilarButton={false}
    />
  );

  const renderYouTubeSection = (
    <YouTubeResources
      resources={youtubeResources}
      isLoading={isYouTubeLoading}
      hasSearched={hasSearched}
      warning={youtubeWarning}
      requestedCount={youTubeRequestedCount}
      sourceCount={youTubeSourceCount}
      heading={resultIntelligence.youtubeHeading}
      description={resultIntelligence.youtubeDescription}
      statusMessage={resultIntelligence.youtubeStatusMessage}
    />
  );

  return (
    <div className="min-h-screen hero-bg transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/55">
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
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-300/55 bg-emerald-100/75 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-300 sm:inline-flex">
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
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Primary sources</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Udemy + Coursera</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Live support</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">YouTube videos and playlists</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Flow</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Search → Compare → Learn</p>
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
        {hasSearched && !isLoading && !isYouTubeLoading ? (
          <ResultsOverview
            query={lastQuery}
            responseTime={responseTime}
            primarySource={resultIntelligence.primarySource}
            courseCount={courses.length}
            youtubeCount={youtubeResources.length}
            courseConfidence={resultIntelligence.courseConfidence}
            youtubeConfidence={resultIntelligence.youtubeConfidence}
            summary={resultIntelligence.summary}
            honestyNote={resultIntelligence.honestyNote}
          />
        ) : null}

        {resultIntelligence.primarySource === "youtube" ? (
          <>
            {renderYouTubeSection}
            {renderCourseSection}
          </>
        ) : (
          <>
            {renderCourseSection}
            {renderYouTubeSection}
          </>
        )}

        <div ref={similarRef}>
          <CourseGrid
            courses={similarCourses}
            onFindSimilar={handleFindSimilar}
            onOpenDetail={setDetailCourse}
            isLoading={isSimilarLoading}
            hasSearched={hasSimilarSearched}
            heading={similarHeading || "Related Course Matches"}
            subtitle="Additional structured alternatives related to your selected course."
            sourceLabel="Similarity Engine"
            emptyMessage="No similar courses were found for the selected result."
            showSimilarButton={false}
          />
        </div>

        {hasSearched && courses.length > 0 ? (
          <AIExplanation query={lastQuery} courses={courses} responseTime={responseTime} />
        ) : null}
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
