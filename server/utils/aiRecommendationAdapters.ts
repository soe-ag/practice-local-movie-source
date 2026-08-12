import { convertToDbType } from "~/utils/utils";
import type { RawMovieWithTotal, MediaType } from "~/utils/type";
import {
  AI_RECOMMENDATION_TIMEOUT_MS,
  type AiCandidate,
  type AiSeedDetails,
} from "~/server/utils/aiRecommendationService";

type TmdbDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  genres?: Array<{ name: string }>;
  keywords?: {
    keywords?: Array<{ name: string }>;
    results?: Array<{ name: string }>;
  };
  credits?: {
    cast?: Array<{ name: string }>;
    crew?: Array<{ name: string; job: string }>;
  };
  created_by?: Array<{ name: string }>;
};

type OpenRouterResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const buildRecommendationPrompt = (seed: AiSeedDetails) => `
Recommend exactly 12 ${seed.type === "movie" ? "movies" : "TV series"} for someone who liked this title.

Selected title: ${seed.title} (${seed.release ?? "year unknown"})
Overview: ${seed.overview || "Not available"}
Genres: ${seed.genres.join(", ") || "Not available"}
Keywords: ${seed.keywords.join(", ") || "Not available"}
Director/creators: ${seed.creators.join(", ") || "Not available"}
Principal cast: ${seed.cast.join(", ") || "Not available"}

Rank recommendations by meaningful similarity in themes, tone, storytelling, pacing,
character dynamics, setting, filmmaking style, creators, and audience appeal. Do not
choose titles merely because they share a genre. Return only real, widely identifiable
titles of the same media type. Give a single concise sentence explaining each match.
Do not include the selected title.

Return only a JSON object with this exact shape and no markdown:
{"recommendations":[{"title":"Real title","year":2000,"reason":"One concise sentence."}]}
The recommendations array must contain exactly 12 items. Use null for an unknown year.
`.trim();

export const parseOpenRouterCandidates = (content: string): AiCandidate[] => {
  const withoutFence = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace < firstBrace) {
    throw new Error("OpenRouter returned invalid JSON");
  }
  const parsed = JSON.parse(
    withoutFence.slice(firstBrace, lastBrace + 1),
  ) as { recommendations?: unknown };
  if (!Array.isArray(parsed.recommendations)) {
    throw new Error("OpenRouter returned an invalid recommendation list");
  }
  return parsed.recommendations.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    if (
      typeof item.title !== "string" ||
      typeof item.reason !== "string" ||
      (typeof item.year !== "number" && item.year !== null)
    ) {
      return [];
    }
    const title = item.title.trim();
    const reason = item.reason.trim();
    if (!title || !reason) return [];
    return [{ title, year: item.year as number | null, reason }];
  });
};

export const createTmdbAdapter = (apiKey: string) => {
  const request = <T>(path: string, params: Record<string, unknown> = {}) =>
    $fetch<T>(`${TMDB_BASE_URL}${path}`, {
      params: { api_key: apiKey, language: "en-US", ...params },
    });

  return {
    async loadSeed({ id, type }: { id: number; type: MediaType }) {
      const details = await request<TmdbDetails>(`/${type}/${id}`, {
        append_to_response: "keywords,credits",
      });
      const date = details.release_date ?? details.first_air_date;
      const directors = (details.credits?.crew ?? [])
        .filter((person) => person.job === "Director")
        .map((person) => person.name);
      return {
        id,
        type,
        title: details.title ?? details.name ?? "Unknown title",
        release: date ? Number(date.slice(0, 4)) : null,
        overview: details.overview ?? "",
        genres: (details.genres ?? []).map((genre) => genre.name),
        keywords: [
          ...(details.keywords?.keywords ?? []),
          ...(details.keywords?.results ?? []),
        ]
          .map((keyword) => keyword.name)
          .slice(0, 15),
        creators: [
          ...directors,
          ...(details.created_by ?? []).map((person) => person.name),
        ].slice(0, 5),
        cast: (details.credits?.cast ?? [])
          .slice(0, 8)
          .map((person) => person.name),
      } satisfies AiSeedDetails;
    },

    async resolveCandidate(candidate: AiCandidate, type: MediaType) {
      const response = await request<RawMovieWithTotal>(`/search/${type}`, {
        query: candidate.title,
        include_adult: false,
        page: 1,
      });
      const normalizedTitle = candidate.title.toLocaleLowerCase();
      const matches = convertToDbType(response, type).movies.filter((movie) => {
        const titleMatches = movie.title.toLocaleLowerCase() === normalizedTitle;
        const yearMatches =
          candidate.year === null || movie.release === candidate.year;
        return titleMatches && yearMatches && movie.type === type;
      });
      return matches.length === 1 ? matches[0]! : null;
    },

    async loadFallback({ id, type }: { id: number; type: MediaType }) {
      const response = await request<RawMovieWithTotal>(
        `/${type}/${id}/recommendations`,
        { page: 1 },
      );
      return convertToDbType(response, type).movies;
    },
  };
};

export const createOpenRouterAdapter = (apiKey: string) => ({
  async generateCandidates(seed: AiSeedDetails, model: string) {
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
    const response = await $fetch<OpenRouterResponse>(OPENROUTER_URL, {
      method: "POST",
      timeout: AI_RECOMMENDATION_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a careful film and television curator. Return only the requested JSON object.",
          },
          { role: "user", content: buildRecommendationPrompt(seed) },
        ],
        reasoning: { effort: "none" },
        max_tokens: 1_200,
        temperature: 0.4,
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned no content");
    const candidates = parseOpenRouterCandidates(content);
    if (!candidates.length) {
      throw new Error("OpenRouter returned no valid candidates");
    }
    return { model: response.model ?? model, candidates };
  },
});
