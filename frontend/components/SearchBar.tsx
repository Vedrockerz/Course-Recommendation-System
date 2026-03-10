"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import type { Filters, SortOption } from "@/services/api";

interface SearchBarProps {
  onSearch: (query: string, filters: Filters, topK: number, sort: SortOption) => void;
  isLoading: boolean;
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
  { value: "longest", label: "Longest Duration" },
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

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [duration, setDuration] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [topK, setTopK] = useState(10);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);
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
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    const filters: Filters = {};
    if (level !== "All") filters.level = level;
    if (duration !== "All") filters.duration_category = duration;
    if (platform !== "All") filters.platform = platform;
    onSearch(trimmed, filters, topK, sort);
  };

  const selectSuggestion = (s: string) => {
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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              filterSuggestions(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            placeholder='Search courses... e.g. "machine learning", "python data science"'
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
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`relative p-2.5 rounded-xl transition-all duration-200
                         ${showFilters
                           ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                           : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-500"}`}
              title="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </button>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
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
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Filter & Controls bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 rounded-xl
                        bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
                        border border-gray-200 dark:border-gray-700 shadow-sm
                        transition-all duration-300">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Filters
          </span>

          {/* Level */}
          <div className="relative">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-sm font-medium
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800
                         text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         transition-colors cursor-pointer"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l === "All" ? "All Levels" : l}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Duration */}
          <div className="relative">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-sm font-medium
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800
                         text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         transition-colors cursor-pointer"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d === "All" ? "All Durations" : d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Platform */}
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-sm font-medium
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800
                         text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         transition-colors cursor-pointer"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p === "All" ? "All Platforms" : p}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Results
          </span>

          {/* Top K */}
          <div className="relative">
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-sm font-medium
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800
                         text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         transition-colors cursor-pointer"
            >
              {TOP_K_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} results</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-sm font-medium
                         border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800
                         text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setLevel("All"); setDuration("All"); setPlatform("All"); setTopK(10); setSort("relevance"); }}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-auto"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
