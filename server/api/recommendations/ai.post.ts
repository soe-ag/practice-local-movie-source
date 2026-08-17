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
const cache = createTtlCache<RecommendationResponse>(CACHE_TTL_MS);
const limiter = createWindowLimiter(5, LIMIT_WINDOW_MS);

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
    limiter,
  });

  return service.recommend(
    input,
    getRequestIP(event, { xForwardedFor: true }) ?? "unknown",
  );
});
