"use client";

import Image from "next/image";
import { ExternalLink, PlayCircle, ListVideo, Youtube, Clock3, Info } from "lucide-react";
import { YouTubeResource } from "@/services/api";

interface YouTubeResourcesProps {
  resources: YouTubeResource[];
  isLoading: boolean;
  hasSearched: boolean;
  warning?: string | null;
  requestedCount?: number;
  sourceCount?: number;
  heading?: string;
  description?: string;
  statusMessage?: string;
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
      <div className="h-24 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/60" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/75 backdrop-blur-md animate-pulse dark:border-slate-800/70 dark:bg-slate-900/60"
          >
            <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2.5 p-4">
              <div className="h-4 w-[92%] rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 w-[65%] rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 w-[50%] rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountNote({ requestedCount, sourceCount, shownCount }: { requestedCount?: number; sourceCount?: number; shownCount: number }) {
  const requested = requestedCount ?? shownCount;
  const source = sourceCount ?? shownCount;

  if (source < requested) {
    return (
      <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Requested {requested} videos, found {source} relevant YouTube matches.
      </p>
    );
  }

  return null;
}

export default function YouTubeResources({
  resources,
  isLoading,
  hasSearched,
  warning,
  requestedCount,
  sourceCount,
  heading = "Best YouTube Videos",
  description = "Supplementary resources to deepen concepts from your top course matches.",
  statusMessage,
}: YouTubeResourcesProps) {
  if (!hasSearched) return null;
  if (isLoading) return <YouTubeSkeleton />;

  return (
    <section>
      <div className="glass-panel mb-5 rounded-2xl px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300">
              <Youtube className="h-3.5 w-3.5" />
              Live YouTube Source
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{heading}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
            <CountNote requestedCount={requestedCount} sourceCount={sourceCount} shownCount={resources.length} />
            {statusMessage ? (
              <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl border border-slate-300/70 bg-slate-100/70 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {statusMessage}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {resources.length} {resources.length === 1 ? "video" : "videos"} shown
            </p>
          </div>
        </div>
      </div>

      {warning ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          {warning}
        </div>
      ) : null}

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-400">
          Only a few or no relevant YouTube videos are currently available for this exact topic. Try broader wording for more live matches.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                className="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-white/75 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/70 dark:bg-slate-900/65 dark:shadow-black/25"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Youtube className="h-10 w-10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    {item.type === "playlist" ? <ListVideo className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    {typeLabel}
                  </span>
                </div>

                <div className="p-4">
                  <h3
                    className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-400"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs text-slate-600 dark:text-slate-300">
                    {item.description || "Open this resource on YouTube to learn more."}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="max-w-[62%] truncate">{item.channel_title || "Unknown Channel"}</span>
                    {published ? (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {published}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                    Open on YouTube
                    <ExternalLink className="h-4 w-4" />
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
