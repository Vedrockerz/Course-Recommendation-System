"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import type { Filters, SortOption } from "@/services/api";

interface SearchBarProps {
  onSearch: (query: string, filters: Filters, topK: number, sort: SortOption) => void;
  isLoading: boolean;
  isBackendReady: boolean;
}

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["All", "Short", "Medium", "Long"];
const PLATFORMS = ["All", "Udemy", "Coursera"];
const TOP_K_OPTIONS = [5, 10, 20, 50];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Highest Rating" },
  { value: "students", label: "Most Students" },
  { value: "shortest", label: "Shortest Duration" },
];

const SUGGESTIONS = [
  "Machine Learning",
  "Python for Beginners",
  "Web Development",
  "Data Science",
  "Deep Learning",
  "React JS",
  "Cloud Computing",
  "Artificial Intelligence",
  "Cybersecurity",
  "Digital Marketing",
  "JavaScript",
  "SQL Database",
  "DevOps",
  "Blockchain",
  "UX Design",
  "Mobile App Development",
  "Natural Language Processing",
  "Computer Vision",
];

export default function SearchBar({ onSearch, isLoading, isBackendReady }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [duration, setDuration] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [topK, setTopK] = useState(10);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filterSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = SUGGESTIONS.filter((s) => s.toLowerCase().includes(lower)).slice(0, 6);
    setSuggestions(filtered);
    setActiveSuggestion(-1);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildFilters = (
    nextLevel: string,
    nextDuration: string,
    nextPlatform: string
  ): Filters => {
    const filters: Filters = {};
    if (nextLevel !== "All") filters.level = nextLevel;
    if (nextDuration !== "All") filters.duration_category = nextDuration;
    if (nextPlatform !== "All") filters.platform = nextPlatform;
    return filters;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBackendReady) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    onSearch(trimmed, buildFilters(level, duration, platform), topK, sort);
  };

  const runSearchIfPossible = (
    nextLevel: string,
    nextDuration: string,
    nextPlatform: string,
    nextTopK: number,
    nextSort: SortOption
  ) => {
    if (!isBackendReady || isLoading) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed, buildFilters(nextLevel, nextDuration, nextPlatform), nextTopK, nextSort);
  };

  const selectSuggestion = (s: string) => {
    if (!isBackendReady) return;
    setQuery(s);
    setShowSuggestions(false);
    onSearch(s, buildFilters(level, duration, platform), topK, sort);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const hasActiveFilters =
    level !== "All" || duration !== "All" || platform !== "All" || topK !== 10 || sort !== "relevance";

  const resetFilters = () => {
    setLevel("All");
    setDuration("All");
    setPlatform("All");
    setTopK(10);
    setSort("relevance");
    runSearchIfPossible("All", "All", "All", 10, "relevance");
  };

  const selectClassName = (isActive: boolean) =>
    `w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm font-medium transition-colors
     bg-white/85 text-slate-700 dark:bg-slate-900/85 dark:text-slate-200
     disabled:cursor-not-allowed disabled:opacity-60 ${
       isActive
         ? "border-sky-300 ring-1 ring-sky-300/40 dark:border-sky-700 dark:ring-sky-800/60"
         : "border-slate-200 dark:border-slate-700"
     }`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <div className="glass-panel rounded-3xl border px-4 py-4 sm:px-5 sm:py-5">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 z-10 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              disabled={!isBackendReady || isLoading}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                filterSuggestions(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isBackendReady
                  ? 'Ask LearnWise: "machine learning roadmap", "best python for data science"'
                  : "Initializing AI Recommendation Engine..."
              }
              className="w-full rounded-2xl border border-slate-200/70 bg-white/90 py-4 pl-12 pr-36 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/35 dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-600 dark:focus:ring-sky-900/50"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors ${
                      i === activeSuggestion
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="absolute right-2 flex items-center">
              <button
                type="submit"
                disabled={!isBackendReady || isLoading || !query.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition-all duration-200 hover:from-sky-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Searching</span>
                  </>
                ) : !isBackendReady ? (
                  "Waiting"
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 rounded-2xl border border-slate-200/75 bg-white/65 px-3 py-3 dark:border-slate-700/70 dark:bg-slate-900/55">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Course Filters
            <span className="rounded-full border border-slate-300/70 px-2 py-0.5 text-[10px] normal-case tracking-normal text-slate-500 dark:border-slate-700 dark:text-slate-400">
              YouTube results are fetched separately
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[150px] flex-1 sm:flex-none">
              <select
                value={platform}
                disabled={!isBackendReady || isLoading}
                onChange={(e) => {
                  const next = e.target.value;
                  setPlatform(next);
                  runSearchIfPossible(level, duration, next, topK, sort);
                }}
                className={selectClassName(platform !== "All")}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p === "All" ? "Platform: All" : p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative min-w-[150px] flex-1 sm:flex-none">
              <select
                value={level}
                disabled={!isBackendReady || isLoading}
                onChange={(e) => {
                  const next = e.target.value;
                  setLevel(next);
                  runSearchIfPossible(next, duration, platform, topK, sort);
                }}
                className={selectClassName(level !== "All")}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l === "All" ? "Level: All" : l}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative min-w-[150px] flex-1 sm:flex-none">
              <select
                value={duration}
                disabled={!isBackendReady || isLoading}
                onChange={(e) => {
                  const next = e.target.value;
                  setDuration(next);
                  runSearchIfPossible(level, next, platform, topK, sort);
                }}
                className={selectClassName(duration !== "All")}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === "All" ? "Duration: All" : d}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative min-w-[170px] flex-1 sm:flex-none">
              <select
                value={sort}
                disabled={!isBackendReady || isLoading}
                onChange={(e) => {
                  const next = e.target.value as SortOption;
                  setSort(next);
                  runSearchIfPossible(level, duration, platform, topK, next);
                }}
                className={selectClassName(sort !== "relevance")}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative min-w-[130px] flex-1 sm:flex-none">
              <select
                value={topK}
                disabled={!isBackendReady || isLoading}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setTopK(next);
                  runSearchIfPossible(level, duration, platform, next, sort);
                }}
                className={selectClassName(topK !== 10)}
              >
                {TOP_K_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    Top Results: {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              disabled={!isBackendReady || isLoading || !hasActiveFilters}
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
