import config from "./config";

export interface Course {
  course_title: string;
  platform: string;
  level: string;
  duration_category: string;
  duration_hours: number;
  rating: number;
  reviewcount: number;
  course_url: string;
  image: string;
  similarity_score?: number;
  metadata?: string;
}

export interface RecommendResponse {
  query: string;
  top_k: number;
  count: number;
  results: Course[];
}

export interface SimilarResponse {
  course_name: string;
  top_k: number;
  count: number;
  results: Course[];
}

export interface Filters {
  level?: string;
  duration_category?: string;
  platform?: string;
}

export type SortOption =
  | "relevance"
  | "rating"
  | "students"
  | "shortest"
  | "longest";

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/health`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === "ok";
  } catch {
    return false;
  }
}

export async function fetchRecommendations(
  query: string,
  filters: Filters = {},
  topK: number = 10
): Promise<RecommendResponse> {
  const params = new URLSearchParams({ query, top_k: String(topK) });
  if (filters.level) params.set("level", filters.level);
  if (filters.duration_category) params.set("duration_category", filters.duration_category);

  const res = await fetch(`${config.apiBaseUrl}/recommend?${params}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchSimilarCourses(
  courseName: string,
  filters: Filters = {},
  topK: number = 10
): Promise<SimilarResponse> {
  const params = new URLSearchParams({ course_name: courseName, top_k: String(topK) });
  if (filters.level) params.set("level", filters.level);
  if (filters.duration_category) params.set("duration_category", filters.duration_category);

  const res = await fetch(`${config.apiBaseUrl}/similar?${params}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function sortCourses(courses: Course[], sort: SortOption): Course[] {
  const sorted = [...courses];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "students":
      return sorted.sort((a, b) => (b.reviewcount ?? 0) - (a.reviewcount ?? 0));
    case "shortest":
      return sorted.sort((a, b) => (a.duration_hours ?? 999) - (b.duration_hours ?? 999));
    case "longest":
      return sorted.sort((a, b) => (b.duration_hours ?? 0) - (a.duration_hours ?? 0));
    default:
      return sorted;
  }
}
