import { createError, getRequestIP, readBody } from "h3";
import type { RecommendationResponse } from "~/utils/type";
import { createAiRecommendationService } from "~/server/utils/aiRecommendationService";
import { parseRecommendationRequest } from "~/server/utils/recommendationRequest";
import {
  createTtlCache,
  createWindowLimiter,
} from "~/server/utils/recommendationInfrastructure";
import {
  createOpenRouterAdapter,
  createTmdbAdapter,
} from "~/server/utils/aiRecommendationAdapters";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LIMIT_WINDOW_MS = 60 * 60 * 1000;
// Uncached AI requests allowed per client per hour. Override with
// AI_RECOMMENDATION_LIMIT_PER_HOUR; the default is generous in development
// (so testing doesn't hit the limit) and strict in production.
const DEFAULT_LIMIT_PER_HOUR = process.env.NODE_ENV === "production" ? 5 : 100;
const cache = createTtlCache<RecommendationResponse>(CACHE_TTL_MS);

let limiter: ReturnType<typeof createWindowLimiter> | undefined;
const getLimiter = (configured: unknown) => {
  if (!limiter) {
    const limit = Number(configured);
    limiter = createWindowLimiter(
      Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT_PER_HOUR,
      LIMIT_WINDOW_MS,
    );
  }
  return limiter;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: unknown; type?: unknown }>(event);
  let input;
  try {
    input = parseRecommendationRequest(body);
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : "Invalid request.",
    });
  }

  const config = useRuntimeConfig(event);
  if (!config.tmdbApiKey) {
    throw createError({ statusCode: 500, statusMessage: "TMDB is not configured." });
  }
  const tmdb = createTmdbAdapter(config.tmdbApiKey);
  const openRouter = createOpenRouterAdapter(config.openrouterApiKey);
  const service = createAiRecommendationService({
    ...tmdb,
    ...openRouter,
    cache,
    limiter: getLimiter(config.aiRecommendationLimitPerHour),
    log: (message) => console.warn(message),
  });

  return service.recommend(
    input,
    getRequestIP(event, { xForwardedFor: true }) ?? "unknown",
  );
});
