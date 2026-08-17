import { describe, expect, it, vi } from "vitest";
import { createTmdbRecommendationService } from "~/server/utils/tmdbRecommendationService";
import type { DbMovie } from "~/utils/type";

const movie = (
  id: number,
  type: DbMovie["type"] = "movie",
): DbMovie => ({
  id,
  title: `Title ${id}`,
  posterUrl: `/poster-${id}.jpg`,
  rating: 7,
  release: 2024,
  type,
  genres: [],
  addedAt: new Date(0),
});

describe("TMDB recommendation service", () => {
  it("returns up to twenty same-type recommendations without the seed", async () => {
    const loadFallback = vi.fn(async () => [
      movie(99),
      movie(1, "tv"),
      ...Array.from({ length: 25 }, (_, index) => movie(index + 1)),
    ]);
    const service = createTmdbRecommendationService({ loadFallback });

    const result = await service.recommend({ id: 99, type: "movie" });

    expect(loadFallback).toHaveBeenCalledWith({ id: 99, type: "movie" });
    expect(result.source).toBe("tmdb");
    expect(result.recommendations).toHaveLength(20);
    expect(result.recommendations.map(({ movie }) => movie.id)).not.toContain(99);
    expect(
      result.recommendations.every(({ movie }) => movie.type === "movie"),
    ).toBe(true);
    expect(
      result.recommendations.every(({ reason }) => reason === undefined),
    ).toBe(true);
  });
});
