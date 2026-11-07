import type {
  DbMovie,
  MediaType,
  RecommendationFallbackReason,
  RecommendationResponse,
} from "~/utils/type";

export const AI_RECOMMENDATION_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "openrouter/free",
] as const;
export const AI_RECOMMENDATION_TIMEOUT_MS = 10_000;
export const AI_RECOMMENDATION_PROMPT_VERSION = "v2";

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
  get(key: string): Promise<RecommendationResponse | null>;
  set(key: string, value: RecommendationResponse): Promise<void>;
};

type Limiter = {
  consume(clientKey: string): Promise<boolean>;
  /** Milliseconds until this client may make another uncached request. */
  retryAfterMs?(clientKey: string): Promise<number>;
};

type Dependencies = {
  loadSeed(input: { id: number; type: MediaType }): Promise<AiSeedDetails>;
  generateCandidates(seed: AiSeedDetails, model: string): Promise<{
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
  /** Receives one line explaining why AI fell back to TMDB (never includes secrets). */
  log?: (message: string) => void;
};

/** Thrown by the AI adapter when the server has no API key, so it is reported as a setup problem. */
export class AiNotConfiguredError extends Error {
  constructor(message = "OPENROUTER_API_KEY is not configured") {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

const redact = (text: string) =>
  text
    .replace(/(api_key=)[^&"\s)]+/gi, "$1[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");

/** One-line, secret-free description of an error, including HTTP status and API error body. */
export const describeError = (error: unknown): string => {
  if (!(error instanceof Error)) return redact(String(error));
  const withDetails = error as {
    statusCode?: number;
    status?: number;
    data?: { error?: { message?: unknown } };
  };
  const status = withDetails.statusCode ?? withDetails.status;
  const apiMessage = withDetails.data?.error?.message;
  return redact(
    [
      error.message,
      status ? `(HTTP ${status})` : "",
      typeof apiMessage === "string" ? `- ${apiMessage.slice(0, 160)}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
};

const fallbackNotice = (
  reason: RecommendationFallbackReason,
  retryAfterMs?: number,
) => {
  if (reason === "rate_limited") {
    const minutes = retryAfterMs
      ? Math.max(1, Math.ceil(retryAfterMs / 60_000))
      : null;
    const wait = minutes ? `Try again in about ${minutes} min. ` : "Try again later. ";
    return `AI picks limit reached. ${wait}Showing standard TMDB matches for now.`;
  }
  if (reason === "not_configured") {
    return "AI picks are not set up on this server (missing OPENROUTER_API_KEY). Showing standard TMDB matches.";
  }
  return "AI recommendations are unavailable, so standard TMDB matches are shown.";
};

const cacheKey = ({ id, type }: { id: number; type: MediaType }) =>
  [
    "ai-recommendations",
    AI_RECOMMENDATION_PROMPT_VERSION,
    AI_RECOMMENDATION_MODELS.join(","),
    type,
    id,
  ].join(":");

export const createAiRecommendationService = (dependencies: Dependencies) => ({
  async recommend(
    input: { id: number; type: MediaType },
    clientKey: string,
  ): Promise<RecommendationResponse> {
    const key = cacheKey(input);
    const cached = await dependencies.cache.get(key);
    if (cached) return cached;

    let reason: RecommendationFallbackReason = "unavailable";
    let retryAfterMs: number | undefined;
    const failures: string[] = [];

    try {
      const allowed = await dependencies.limiter.consume(clientKey);
      if (!allowed) {
        reason = "rate_limited";
        retryAfterMs = await dependencies.limiter.retryAfterMs?.(clientKey);
        failures.push(`request limit reached for client "${clientKey}"`);
      } else {
        const seed = await dependencies.loadSeed(input);
        let notConfigured = 0;
        for (const model of AI_RECOMMENDATION_MODELS) {
          try {
            const generated = await dependencies.generateCandidates(seed, model);
            const seen = new Set<string>([`${input.type}:${input.id}`]);
            const resolved = await Promise.all(
              generated.candidates.slice(0, 24).map(async (candidate) => ({
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
              .slice(0, 20);
            if (!recommendations.length) {
              failures.push(`${model}: no TMDB-verifiable matches`);
              continue;
            }
            const response: RecommendationResponse = {
              source: "ai",
              model: generated.model,
              recommendations,
            };
            await dependencies.cache.set(key, response);
            return response;
          } catch (error) {
            if (error instanceof AiNotConfiguredError) notConfigured += 1;
            failures.push(`${model}: ${describeError(error)}`);
          }
        }
        if (notConfigured === AI_RECOMMENDATION_MODELS.length) {
          reason = "not_configured";
        }
      }
    } catch (error) {
      failures.push(describeError(error));
    }

    dependencies.log?.(
      `[ai-recommendations] fell back to TMDB (${reason}) for ${input.type}:${input.id}: ${failures.join("; ")}`,
    );
    const fallback = await dependencies.loadFallback(input);
    return {
      source: "tmdb",
      recommendations: fallback
        .filter((movie) => movie.type === input.type && movie.id !== input.id)
        .slice(0, 20)
        .map((movie) => ({ movie })),
      notice: fallbackNotice(reason, retryAfterMs),
      fallbackReason: reason,
    };
  },
});
