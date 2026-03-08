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
}

export async function fetchRecommendations(
  query: string,
  filters: Filters = {}
): Promise<RecommendResponse> {
  const params = new URLSearchParams({ query, top_k: "10" });
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
  filters: Filters = {}
): Promise<SimilarResponse> {
  const params = new URLSearchParams({ course_name: courseName, top_k: "10" });
  if (filters.level) params.set("level", filters.level);
  if (filters.duration_category) params.set("duration_category", filters.duration_category);

  const res = await fetch(`${config.apiBaseUrl}/similar?${params}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
