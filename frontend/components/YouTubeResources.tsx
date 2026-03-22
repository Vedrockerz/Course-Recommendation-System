"use client";

import { ExternalLink, PlayCircle, ListVideo, Youtube, Clock3 } from "lucide-react";
import { YouTubeResource } from "@/services/api";

interface YouTubeResourcesProps {
  resources: YouTubeResource[];
  isLoading: boolean;
  hasSearched: boolean;
  warning?: string | null;
}

function formatPublishedDate(rawDate?: string): string {
  if (!rawDate) return "";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function YouTubeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-red-300/80 dark:bg-red-700/80 animate-pulse" />
        <div className="h-6 w-72 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-800/60
                       bg-white/70 dark:bg-gray-900/60 backdrop-blur-md animate-pulse"
          >
            <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 w-[92%] bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3.5 w-[65%] bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3.5 w-[50%] bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function YouTubeResources({
  resources,
  isLoading,
  hasSearched,
  warning,
}: YouTubeResourcesProps) {
  if (!hasSearched) return null;
  if (isLoading) return <YouTubeSkeleton />;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-red-500 to-rose-500" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Youtube className="w-6 h-6 text-red-500" />
            Latest YouTube Learning Resources
          </h2>
        </div>
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
          {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      {warning && (
        <div className="mb-4 rounded-xl p-3 text-sm
                        bg-amber-50 dark:bg-amber-900/20
                        border border-amber-200 dark:border-amber-800/40
                        text-amber-700 dark:text-amber-300">
          {warning}
        </div>
      )}

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700
                        px-5 py-8 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-900/40">
          No live YouTube resources found for this query right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((item, index) => {
            const published = formatPublishedDate(item.published_date);
            const typeLabel = item.type === "playlist" ? "Playlist" : "Video";
            const resourceUrl = item.video_url || "https://www.youtube.com";

            return (
              <a
                key={`${item.video_url || item.title}-${index}`}
                href={resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl overflow-hidden
                           bg-white/70 dark:bg-gray-900/70 backdrop-blur-md
                           border border-gray-200/60 dark:border-gray-800/60
                           shadow-md hover:shadow-xl dark:shadow-black/20
                           hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Youtube className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                  <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[11px] font-bold
                                   bg-black/60 text-white backdrop-blur-sm inline-flex items-center gap-1">
                    {item.type === "playlist" ? <ListVideo className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                    {typeLabel}
                  </span>
                </div>

                <div className="p-4">
                  <h3
                    className="text-[15px] font-bold leading-snug line-clamp-2
                               text-gray-900 dark:text-gray-50
                               group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 min-h-[2.25rem]">
                    {item.description || "Open this resource on YouTube to learn more."}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="truncate max-w-[62%]">{item.channel_title || "Unknown Channel"}</span>
                    {published && (
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Clock3 className="w-3 h-3" />
                        {published}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                    Open on YouTube
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
