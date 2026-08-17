import type { DbMovie, MediaType, RecommendationResponse } from "~/utils/type";

type Dependencies = {
  loadFallback(input: { id: number; type: MediaType }): Promise<DbMovie[]>;
};

export const createTmdbRecommendationService = (
  dependencies: Dependencies,
) => ({
  async recommend(input: {
    id: number;
    type: MediaType;
  }): Promise<RecommendationResponse> {
    const recommendations = await dependencies.loadFallback(input);
    return {
      source: "tmdb",
      recommendations: recommendations
        .filter((movie) => movie.type === input.type && movie.id !== input.id)
        .slice(0, 20)
        .map((movie) => ({ movie })),
    };
  },
});
