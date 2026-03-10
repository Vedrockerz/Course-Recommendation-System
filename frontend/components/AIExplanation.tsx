"use client";

import { Sparkles, Brain, Target, TrendingUp, BookOpen, Lightbulb } from "lucide-react";
import { Course } from "@/services/api";

interface AIExplanationProps {
  query: string;
  courses: Course[];
  responseTime: number | null;
}

export default function AIExplanation({ query, courses, responseTime }: AIExplanationProps) {
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
    <div className="rounded-2xl overflow-hidden
                    bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-white
                    dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-gray-900/50
                    border border-indigo-100 dark:border-indigo-900/50
                    backdrop-blur-sm">
      <div className="px-5 py-4 border-b border-indigo-100 dark:border-indigo-900/50
                      flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Why these courses were recommended
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI-powered analysis of your search
            {responseTime != null && ` · ${responseTime}ms`}
          </p>
        </div>
      </div>
      <div className="p-5 space-y-3">
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
    </div>
  );
}
