"use client";

import { useState } from "react";
import { Sparkles, Brain, Target, TrendingUp, BookOpen, Lightbulb } from "lucide-react";
import { Course } from "@/services/api";

interface AIExplanationProps {
  query: string;
  courses: Course[];
  responseTime: number | null;
}

export default function AIExplanation({ query, courses, responseTime }: AIExplanationProps) {
  const [open, setOpen] = useState(false);
  if (!query || courses.length === 0) return null;

  const platforms = Array.from(new Set(courses.map((c) => c.platform).filter(Boolean)));
  const levels = Array.from(new Set(courses.map((c) => c.level).filter(Boolean)));
  const avgRating = courses.reduce((sum, c) => sum + (c.rating ?? 0), 0) / courses.length;
  const avgMatch = courses.reduce((sum, c) => sum + (c.similarity_score ?? 0), 0) / courses.length;
  const topMatch = Math.max(...courses.map((c) => c.similarity_score ?? 0));

  const explanations: { icon: typeof Sparkles; text: string }[] = [
    {
      icon: Brain,
      text: `Used multilingual BERT embeddings to find courses semantically related to "${query}"`,
    },
    {
      icon: Target,
      text: `Top match has ${Math.round(topMatch * 100)}% similarity score — courses are ranked by AI relevance combined with rating and popularity`,
    },
    {
      icon: TrendingUp,
      text: `Average course rating is ${avgRating.toFixed(1)}/5.0 across ${courses.length} selected results`,
    },
    {
      icon: BookOpen,
      text: `Results span ${platforms.join(", ")} covering ${levels.join(", ")} levels`,
    },
  ];

  if (avgMatch > 0.7) {
    explanations.push({
      icon: Lightbulb,
      text: "High confidence matches — these courses closely align with your search intent",
    });
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-2xl border border-slate-200/75 bg-white/70 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/55"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 shadow-md shadow-indigo-500/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">How we ranked these results</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Compact relevance explanation
              {responseTime != null && ` · ${responseTime}ms`}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{open ? "Hide" : "View"}</span>
      </summary>

      <div className="space-y-3 border-t border-slate-200/75 p-5 dark:border-slate-800/70">
        {explanations.map((exp, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 w-6 h-6 rounded-md flex-shrink-0
                            bg-indigo-100 dark:bg-indigo-900/40
                            flex items-center justify-center">
              <exp.icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {exp.text}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
