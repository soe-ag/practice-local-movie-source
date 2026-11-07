import { createError, getQuery } from "h3";
import type { H3Event } from "h3";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const MAX_PAGE = 500; // TMDB rejects pages above 500
const MAX_QUERY_LENGTH = 200;

export type TmdbMediaType = "movie" | "tv";

export const parsePage = (value: unknown): number => {
  const page = Number(Array.isArray(value) ? value[0] : value ?? 1);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw createError({ statusCode: 400, statusMessage: "Invalid page." });
  }
  return page;
};

export type TrendingWindow = "day" | "week";

/** Defaults to the weekly trending list. */
export const parseTrendingWindow = (value: unknown): TrendingWindow => {
  const window = Array.isArray(value) ? value[0] : value;
  if (window === undefined || window === "") return "week";
  if (window === "day" || window === "week") return window;
  throw createError({ statusCode: 400, statusMessage: "Invalid trending window." });
};

/** TMDB's "all" trending feed can also contain people; keep only movies and TV. */
export const keepMoviesAndTv = <T extends { results: Array<{ media_type?: string }> }>(
  response: T,
): T => ({
  ...response,
  results: response.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv",
  ),
});

export const parseMediaType = (value: unknown): TmdbMediaType => {
  if (value === "movie" || value === "tv") return value;
  throw createError({ statusCode: 400, statusMessage: "Invalid media type." });
};

export const parseTmdbId = (value: unknown): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id." });
  }
  return id;
};

export const parseSearchQuery = (value: unknown): string => {
  const query = (Array.isArray(value) ? value[0] : value);
  if (typeof query !== "string" || !query.trim() || query.length > MAX_QUERY_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: "Invalid query." });
  }
  return query.trim();
};

export const readQuery = (event: H3Event) => getQuery(event);

/** Calls TMDB with the server-side API key; the key never reaches the client. */
export const tmdbRequest = async <T>(
  event: H3Event,
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> => {
  const { tmdbApiKey } = useRuntimeConfig(event);
  if (!tmdbApiKey) {
    throw createError({ statusCode: 500, statusMessage: "TMDB is not configured." });
  }
  try {
    // Cast: Nitro's typed $fetch can't express a caller-chosen response type for an
    // external URL, so the generic is applied here instead.
    const response: unknown = await $fetch(`${TMDB_BASE_URL}${path}`, {
      params: { api_key: tmdbApiKey, language: "en-US", ...params },
    });
    return response as T;
  } catch (error) {
    const status = (error as { statusCode?: number; status?: number }).statusCode
      ?? (error as { status?: number }).status;
    // Don't forward TMDB's error body: it can echo the request URL, including the key.
    throw createError({
      statusCode: status === 404 ? 404 : 502,
      statusMessage: status === 404 ? "Not found." : "TMDB request failed.",
    });
  }
};
