import { createError, readBody } from "h3";
import { createTmdbAdapter } from "~/server/utils/aiRecommendationAdapters";
import { parseRecommendationRequest } from "~/server/utils/recommendationRequest";
import { createTmdbRecommendationService } from "~/server/utils/tmdbRecommendationService";

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
    throw createError({
      statusCode: 500,
      statusMessage: "TMDB is not configured.",
    });
  }

  const service = createTmdbRecommendationService(
    createTmdbAdapter(config.tmdbApiKey),
  );
  return service.recommend(input);
});
