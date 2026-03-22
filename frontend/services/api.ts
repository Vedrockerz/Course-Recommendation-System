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

export interface YouTubeResource {
  title: string;
  description?: string;
  thumbnail?: string;
  channel_title?: string;
  published_date?: string;
  video_url?: string;
  type: "video" | "playlist";
  source: "youtube";
}

export interface YouTubeResponse {
  query: string;
  top_k: number;
  count: number;
  results: YouTubeResource[];
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

export interface HealthStatus {
  status: string;
  backend_ready: boolean;
  uptime: number;
  timestamp: string;
  environment: string;
  version: string;
}

// Error types for better programmatic handling
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class TimeoutError extends ApiError {
  constructor() {
    super("TIMEOUT", 408, "Request timed out. Please try again.");
    this.name = "TimeoutError";
  }
}

export class NetworkError extends ApiError {
  constructor() {
    super("NETWORK_ERROR", 0, "Unable to connect to the server. Please check your connection.");
    this.name = "NetworkError";
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message?: string) {
    super(
      "SERVICE_UNAVAILABLE",
      503,
      message || "Service is temporarily unavailable. Please try again in a few seconds."
    );
    this.name = "ServiceUnavailableError";
  }
}

// Generic fetch with timeout, retry, and error handling
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.apiTimeout
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    // Retry logic for transient failures
    if (!response.ok) {
      // 503 Service Unavailable - backend initializing
      if (response.status === 503) {
        if (retryCount < config.maxRetries) {
          const delay = config.retryDelayMs * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retryCount + 1);
        }
        throw new ServiceUnavailableError();
      }

      // 504 Gateway Timeout - service timeout
      if (response.status === 504) {
        if (retryCount < config.maxRetries) {
          const delay = config.retryDelayMs * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retryCount + 1);
        }
        throw new TimeoutError();
      }

      // Other client errors
      if (response.status >= 400 && response.status < 500) {
        const text = await response.text();
        const detail = tryParseErrorDetail(text) || response.statusText;
        throw new ApiError(
          `HTTP_${response.status}`,
          response.status,
          detail
        );
      }

      // Server errors - retry with backoff
      if (response.status >= 500) {
        if (retryCount < config.maxRetries) {
          const delay = config.retryDelayMs * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retryCount + 1);
        }
        throw new ApiError(
          `HTTP_${response.status}`,
          response.status,
          "Server error. Please try again later."
        );
      }
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    // Network error or abort
    if (
      err instanceof TypeError ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      if (err.name === "AbortError") {
        throw new TimeoutError();
      }
      throw new NetworkError();
    }

    throw err;
  }
}

// Helper to extract error details from response
function tryParseErrorDetail(text: string): string | null {
  try {
    const json = JSON.parse(text);
    return json.detail || json.message || null;
  } catch {
    return null;
  }
}

// Health check with simpler retry (no exponential backoff needed)
export async function checkBackendHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as HealthStatus;
  } catch {
    return null;
  }
}

// Fetch recommendations with retry
export async function fetchRecommendations(
  query: string,
  filters: Filters = {},
  topK: number = 10
): Promise<RecommendResponse> {
  const params = new URLSearchParams({ query, top_k: String(topK) });
  if (filters.level) params.set("level", filters.level);
  if (filters.duration_category)
    params.set("duration_category", filters.duration_category);

  const response = await fetchWithRetry(
    `${config.apiBaseUrl}/recommend?${params}`
  );

  if (!response.ok) {
    throw new ApiError(
      `HTTP_${response.status}`,
      response.status,
      "Failed to fetch recommendations"
    );
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.results)) {
    throw new ApiError(
      "INVALID_RESPONSE",
      500,
      "Server returned malformed response"
    );
  }

  return data as RecommendResponse;
}

// Fetch similar courses with retry
export async function fetchSimilarCourses(
  courseName: string,
  filters: Filters = {},
  topK: number = 10
): Promise<SimilarResponse> {
  const params = new URLSearchParams({
    course_name: courseName,
    top_k: String(topK),
  });
  if (filters.level) params.set("level", filters.level);
  if (filters.duration_category)
    params.set("duration_category", filters.duration_category);

  const response = await fetchWithRetry(
    `${config.apiBaseUrl}/similar?${params}`
  );

  if (!response.ok) {
    throw new ApiError(
      `HTTP_${response.status}`,
      response.status,
      "Failed to fetch similar courses"
    );
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.results)) {
    throw new ApiError(
      "INVALID_RESPONSE",
      500,
      "Server returned malformed response"
    );
  }

  return data as SimilarResponse;
}

export async function fetchYouTubeResources(
  query: string,
  topK: number = 6
): Promise<YouTubeResponse> {
  const params = new URLSearchParams({ query, top_k: String(topK) });

  const response = await fetchWithRetry(
    `${config.apiBaseUrl}/youtube?${params}`
  );

  if (!response.ok) {
    throw new ApiError(
      `HTTP_${response.status}`,
      response.status,
      "Failed to fetch YouTube resources"
    );
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.results)) {
    throw new ApiError(
      "INVALID_RESPONSE",
      500,
      "Server returned malformed YouTube response"
    );
  }

  return data as YouTubeResponse;
}

// Utility to sort courses
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
