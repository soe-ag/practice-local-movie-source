import { describe, expect, it, vi } from "vitest";
import type { DbMovie, RecommendationSeed } from "~/utils/type";
import { createRecommendationLoader } from "~/utils/recommendationLoader";

const seed = (id: number, title: string): RecommendationSeed => ({
  id,
  title,
  type: "movie",
  genres: ["Drama"],
  posterUrl: `/seed-${id}.jpg`,
});

describe("createRecommendationLoader", () => {
  it("returns successful groups and identifies seeds whose requests failed", async () => {
    const candidate = { id: 10, type: "movie" } as DbMovie;
    const fetcher = vi
      .fn<(seed: RecommendationSeed) => Promise<DbMovie[]>>()
      .mockResolvedValueOnce([candidate])
      .mockRejectedValueOnce(new Error("network"));
    const loader = createRecommendationLoader(fetcher);

    const result = await loader.load([seed(1, "Working"), seed(2, "Failed")]);

    expect(result.groups).toEqual([
      { seed: seed(1, "Working"), candidates: [candidate] },
    ]);
    expect(result.failedSeeds).toEqual(["Failed"]);
  });

  it("reuses successful seed results during the current page session", async () => {
    const fetcher = vi.fn(async () => [{ id: 10, type: "movie" } as DbMovie]);
    const loader = createRecommendationLoader(fetcher);
    const selectedSeed = seed(1, "Cached");

    await loader.load([selectedSeed]);
    await loader.load([selectedSeed]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns an empty group list when every seed request fails", async () => {
    const loader = createRecommendationLoader(async () => {
      throw new Error("network");
    });

    const result = await loader.load([seed(1, "One"), seed(2, "Two")]);

    expect(result.groups).toEqual([]);
    expect(result.failedSeeds).toEqual(["One", "Two"]);
  });
});
