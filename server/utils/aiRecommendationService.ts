import type {
  AiRecommendationResponse,
  DbMovie,
  MediaType,
} from "~/utils/type";

export const AI_RECOMMENDATION_MODEL = "openrouter/free";
export const AI_RECOMMENDATION_PROMPT_VERSION = "v1";

export type AiSeedDetails = {
  id: number;
  type: MediaType;
  title: string;
  release: number | null;
  overview: string;
  genres: string[];
  keywords: string[];
  creators: string[];
  cast: string[];
};

export type AiCandidate = {
  title: string;
  year: number | null;
  reason: string;
};

type Cache = {
  get(key: string): Promise<AiRecommendationResponse | null>;
  set(key: string, value: AiRecommendationResponse): Promise<void>;
};

type Limiter = {
  consume(clientKey: string): Promise<boolean>;
};

type Dependencies = {
  loadSeed(input: { id: number; type: MediaType }): Promise<AiSeedDetails>;
  generateCandidates(seed: AiSeedDetails): Promise<{
    model: string;
    candidates: AiCandidate[];
  }>;
  resolveCandidate(
    candidate: AiCandidate,
    type: MediaType,
  ): Promise<DbMovie | null>;
  loadFallback(input: { id: number; type: MediaType }): Promise<DbMovie[]>;
  cache: Cache;
  limiter: Limiter;
};

const cacheKey = ({ id, type }: { id: number; type: MediaType }) =>
  [
    "ai-recommendations",
    AI_RECOMMENDATION_PROMPT_VERSION,
    AI_RECOMMENDATION_MODEL,
    type,
    id,
  ].join(":");

export const createAiRecommendationService = (dependencies: Dependencies) => ({
  async recommend(
    input: { id: number; type: MediaType },
    clientKey: string,
  ): Promise<AiRecommendationResponse> {
    const key = cacheKey(input);
    const cached = await dependencies.cache.get(key);
    if (cached) return cached;

    try {
      const allowed = await dependencies.limiter.consume(clientKey);
      if (!allowed) throw new Error("AI recommendation limit reached");
      const seed = await dependencies.loadSeed(input);
      const generated = await dependencies.generateCandidates(seed);
      const seen = new Set<string>([`${input.type}:${input.id}`]);
      const resolved = await Promise.all(
        generated.candidates.slice(0, 12).map(async (candidate) => ({
          movie: await dependencies.resolveCandidate(candidate, input.type),
          reason: candidate.reason,
        })),
      );
      const recommendations = resolved
        .flatMap(({ movie, reason }) => {
          if (!movie || movie.type !== input.type) return [];
          const movieKey = `${movie.type}:${movie.id}`;
          if (seen.has(movieKey)) return [];
          seen.add(movieKey);
          return [{ movie, reason: reason.trim().slice(0, 240) }];
        })
        .slice(0, 10);
      if (!recommendations.length) throw new Error("AI returned no valid titles");
      const response: AiRecommendationResponse = {
        source: "ai",
        model: generated.model,
        recommendations,
      };
      await dependencies.cache.set(key, response);
      return response;
    } catch {
      const fallback = await dependencies.loadFallback(input);
      return {
        source: "tmdb",
        recommendations: fallback
          .filter((movie) => movie.type === input.type && movie.id !== input.id)
          .slice(0, 10)
          .map((movie) => ({ movie })),
        notice:
          "AI recommendations are unavailable, so standard TMDB matches are shown.",
      };
    }
  },
});
