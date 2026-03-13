"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, ChevronDown, X } from "lucide-react";
import type { Filters, SortOption } from "@/services/api";

interface SearchBarProps {
  onSearch: (query: string, filters: Filters, topK: number, sort: SortOption) => void;
  isLoading: boolean;
  isBackendReady: boolean;
}

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["All", "Short", "Medium", "Long"];
const PLATFORMS = ["All", "Udemy", "Coursera", "YouTube"];
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
  "Music Theory",
  "Photography",
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
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBackendReady) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    const filters: Filters = {};
    if (level !== "All") filters.level = level;
    if (duration !== "All") filters.duration_category = duration;
    if (platform !== "All") filters.platform = platform;
    onSearch(trimmed, filters, topK, sort);
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

    const filters: Filters = {};
    if (nextLevel !== "All") filters.level = nextLevel;
    if (nextDuration !== "All") filters.duration_category = nextDuration;
    if (nextPlatform !== "All") filters.platform = nextPlatform;

    onSearch(trimmed, filters, nextTopK, nextSort);
  };

  const selectSuggestion = (s: string) => {
    if (!isBackendReady) return;
    setQuery(s);
    setShowSuggestions(false);
    const filters: Filters = {};
    if (level !== "All") filters.level = level;
    if (duration !== "All") filters.duration_category = duration;
    if (platform !== "All") filters.platform = platform;
    onSearch(s, filters, topK, sort);
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

  const hasActiveFilters = level !== "All" || duration !== "All" || platform !== "All" || topK !== 10 || sort !== "relevance";

  const resetFilters = () => {
    setLevel("All");
    setDuration("All");
    setPlatform("All");
    setTopK(10);
    setSort("relevance");
    runSearchIfPossible("All", "All", "All", 10, "relevance");
  };

  const selectClassName = (isActive: boolean) =>
    `w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium border bg-white dark:bg-gray-800
     focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer
     disabled:opacity-60 disabled:cursor-not-allowed ${
       isActive
         ? "border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
         : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
     }`;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
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
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            placeholder={
              isBackendReady
                ? 'Search courses... e.g. "machine learning", "python data science"'
                : "Initializing AI Recommendation Engine..."
            }
            className="w-full pl-12 pr-36 py-4 rounded-2xl
                       border border-gray-200 dark:border-gray-700
                       bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
                       text-gray-900 dark:text-gray-100 text-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
                       dark:focus:ring-indigo-400/30 dark:focus:border-indigo-500
                       transition-all duration-200
                       placeholder:text-gray-400 dark:placeholder:text-gray-600"
            autoComplete="off"
          />

          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 z-50
                         bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                         border border-gray-200 dark:border-gray-700
                         rounded-xl shadow-xl dark:shadow-black/40
                         overflow-hidden"
            >
              {suggestions.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3
                             transition-colors duration-150
                             ${i === activeSuggestion
                               ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                               : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                >
                  <Search className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!isBackendReady || isLoading || !query.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600
                         text-white font-semibold rounded-xl
                         hover:from-indigo-600 hover:to-purple-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-md hover:shadow-lg
                         hover:shadow-indigo-500/25 dark:hover:shadow-indigo-500/15
                         flex items-center gap-2 active:scale-[0.97]"
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

      {/* Always-visible Filter & Controls row */}
      <div className="px-4 py-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80
                      bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">
            Filters
          </span>

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
                <option key={p} value={p}>{p === "All" ? "Platform: All" : p}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
                <option key={l} value={l}>{l === "All" ? "Level: All" : l}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
                <option key={d} value={d}>{d === "All" ? "Duration: All" : d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
                <option key={n} value={n}>Results: {n}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <button
            type="button"
            disabled={!isBackendReady || isLoading || !hasActiveFilters}
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                       border border-gray-200 dark:border-gray-700
                       bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {platform !== "All" && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                               bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Platform: {platform}
              </span>
            )}
            {level !== "All" && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                               bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Level: {level}
              </span>
            )}
            {duration !== "All" && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                               bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Duration: {duration}
              </span>
            )}
            {sort !== "relevance" && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                               bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              </span>
            )}
            {topK !== 10 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                               bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Results: {topK}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
