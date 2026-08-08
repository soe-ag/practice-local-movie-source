import { describe, expect, it } from "vitest";
import type { DbMovie, RecommendationSeed } from "~/utils/type";
import {
  buildRecommendations,
  paginateRecommendations,
} from "~/utils/recommendations";

const movie = (
  id: number,
  overrides: Partial<DbMovie> = {},
): DbMovie => ({
  id,
  title: `Movie ${id}`,
  posterUrl: `/poster-${id}.jpg`,
  rating: 7,
  release: 2024,
  type: "movie",
  genres: ["Drama"],
  addedAt: new Date(0),
  overview: "",
  voteCount: 100,
  popularity: 10,
  ...overrides,
});

const seed = (
  id: number,
  title: string,
  genres: string[] = ["Drama"],
): RecommendationSeed => ({
  id,
  title,
  type: "movie",
  genres,
  posterUrl: `/seed-${id}.jpg`,
});

describe("buildRecommendations", () => {
  it("merges duplicate recommendations and ranks titles recommended by more seeds first", () => {
    const result = buildRecommendations({
      groups: [
        { seed: seed(1, "Seed One"), candidates: [movie(10), movie(11)] },
        { seed: seed(2, "Seed Two"), candidates: [movie(10), movie(12)] },
      ],
      excludedKeys: new Set(),
    });

    expect(result[0]).toMatchObject({
      id: 10,
      seedMatchCount: 2,
    });
    expect(result.map((item) => item.id)).toEqual([10, 11, 12]);
  });

  it("excludes exact media keys without removing a TV title that shares the same numeric id", () => {
    const result = buildRecommendations({
      groups: [
        {
          seed: seed(1, "Seed One"),
          candidates: [movie(10), movie(10, { type: "tv", title: "TV 10" })],
        },
      ],
      excludedKeys: new Set(["movie:10"]),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 10, type: "tv", title: "TV 10" });
  });

  it("collects shared genres from every seed that recommends a title", () => {
    const candidate = movie(10, { genres: ["Drama", "Action"] });
    const result = buildRecommendations({
      groups: [
        { seed: seed(1, "Drama Seed", ["Drama"]), candidates: [candidate] },
        { seed: seed(2, "Action Seed", ["Action"]), candidates: [candidate] },
      ],
      excludedKeys: new Set(),
    });

    expect(result[0]!.sharedGenres).toEqual(["Drama", "Action"]);
  });

  it("applies filters before limiting the ranked results", () => {
    const result = buildRecommendations({
      groups: [
        {
          seed: seed(1, "Seed One"),
          candidates: [
            movie(10, { type: "movie", rating: 9 }),
            movie(11, { type: "tv", rating: 8.5 }),
            movie(12, { type: "tv", rating: 8.2 }),
          ],
        },
      ],
      excludedKeys: new Set(),
      filters: { type: "tv", rating: "gt8" },
      limit: 2,
    });

    expect(result.map((item) => item.id)).toEqual([11, 12]);
  });

  it("uses rating, vote count, popularity, and media key as stable tie-breakers", () => {
    const result = buildRecommendations({
      groups: [
        {
          seed: seed(1, "Seed One"),
          candidates: [
            movie(14, { rating: 8, voteCount: 100, popularity: 20 }),
            movie(13, { rating: 8, voteCount: 200, popularity: 10 }),
            movie(12, { rating: 8.5, voteCount: 10, popularity: 1 }),
            movie(11, { rating: 8, voteCount: 200, popularity: 30 }),
            movie(10, { rating: 8, voteCount: 200, popularity: 30 }),
          ],
        },
      ],
      excludedKeys: new Set(),
    });

    expect(result.map((item) => item.id)).toEqual([12, 10, 11, 13, 14]);
  });

  it("counts distinct seed identities even when their titles are the same", () => {
    const duplicateTitleTvSeed = {
      ...seed(2, "Shared Title"),
      type: "tv",
    };
    const result = buildRecommendations({
      groups: [
        { seed: seed(1, "Shared Title"), candidates: [movie(10)] },
        { seed: duplicateTitleTvSeed, candidates: [movie(10)] },
      ],
      excludedKeys: new Set(),
    });

    expect(result[0]!.seedMatchCount).toBe(2);
  });

  it("paginates at 20 results and caps the list at three pages", () => {
    const candidates = Array.from({ length: 75 }, (_, index) => index + 1);

    const firstPage = paginateRecommendations(candidates, 1);
    const thirdPage = paginateRecommendations(candidates, 3);

    expect(firstPage.items).toEqual(candidates.slice(0, 20));
    expect(thirdPage.items).toEqual(candidates.slice(40, 60));
    expect(thirdPage.totalResults).toBe(60);
    expect(thirdPage.totalPages).toBe(3);
  });
});
