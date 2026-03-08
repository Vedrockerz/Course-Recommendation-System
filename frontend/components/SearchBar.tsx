"use client";

import { useState } from "react";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import type { Filters } from "@/services/api";

interface SearchBarProps {
  onSearch: (query: string, filters: Filters) => void;
  isLoading: boolean;
}

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["All", "Short", "Medium", "Long"];

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [duration, setDuration] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const filters: Filters = {};
    if (level !== "All") filters.level = level;
    if (duration !== "All") filters.duration_category = duration;
    onSearch(trimmed, filters);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search courses... e.g. "machine learning", "python data science"'
            className="w-full pl-12 pr-36 py-4 rounded-2xl
                       border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900
                       text-gray-900 dark:text-gray-100 text-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition-all duration-200
                       placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`p-2.5 rounded-xl transition-all duration-200
                         ${showFilters
                           ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                           : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-500"}`}
              title="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600
                         text-white font-semibold rounded-xl
                         hover:from-indigo-600 hover:to-purple-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-md hover:shadow-lg
                         flex items-center gap-2"
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

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-2 py-3 rounded-xl
                        bg-white/80 dark:bg-gray-900/80 backdrop-blur
                        border border-gray-200 dark:border-gray-700 shadow-sm
                        animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Filters
          </span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
                       border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800
                       text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-indigo-500
                       transition-colors"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l === "All" ? "All Levels" : l}
              </option>
            ))}
          </select>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
                       border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800
                       text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-indigo-500
                       transition-colors"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Durations" : d}
              </option>
            ))}
          </select>
          {(level !== "All" || duration !== "All") && (
            <button
              type="button"
              onClick={() => { setLevel("All"); setDuration("All"); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
