import { describe, expect, it, vi } from "vitest";
import { createAiRecommendationService } from "~/server/utils/aiRecommendationService";
import type { DbMovie } from "~/utils/type";

const movie = (id: number, title: string): DbMovie => ({
  id,
  title,
  posterUrl: `/poster-${id}.jpg`,
  rating: 8,
  release: 2020,
  type: "movie",
  genres: ["Drama"],
  addedAt: new Date(0),
  overview: `${title} overview`,
  voteCount: 100,
  popularity: 20,
});

describe("AI recommendation service", () => {
  it("returns verified movies in AI order with concise match reasons", async () => {
    const second = movie(2, "Second Choice");
    const first = movie(1, "First Choice");
    const service = createAiRecommendationService({
      loadSeed: vi.fn(async () => ({
        id: 99,
        type: "movie" as const,
        title: "Seed",
        release: 2024,
        overview: "A tense character study.",
        genres: ["Drama"],
        keywords: ["identity"],
        creators: ["A Director"],
        cast: ["An Actor"],
      })),
      generateCandidates: vi.fn(async () => ({
        model: "free/test-model",
        candidates: [
          { title: "First Choice", year: 2020, reason: "Similar moral tension." },
          { title: "Second Choice", year: 2020, reason: "A matching slow-burn mood." },
        ],
      })),
      resolveCandidate: vi.fn(async (candidate) =>
        candidate.title === "First Choice" ? first : second,
      ),
      loadFallback: vi.fn(async () => []),
      cache: {
        get: vi.fn(async () => null),
        set: vi.fn(async () => undefined),
      },
      limiter: { consume: vi.fn(async () => true) },
    });

    const result = await service.recommend(
      { id: 99, type: "movie" },
      "client-1",
    );

    expect(result).toMatchObject({
      source: "ai",
      model: "free/test-model",
      recommendations: [
        { movie: first, reason: "Similar moral tension." },
        { movie: second, reason: "A matching slow-burn mood." },
      ],
    });
  });

  it("falls back to verified TMDB recommendations when AI generation fails", async () => {
    const fallbackMovie = movie(7, "Fallback");
    const service = createAiRecommendationService({
      loadSeed: vi.fn(async () => {
        throw new Error("OpenRouter unavailable");
      }),
      generateCandidates: vi.fn(),
      resolveCandidate: vi.fn(),
      loadFallback: vi.fn(async () => [fallbackMovie]),
      cache: {
        get: vi.fn(async () => null),
        set: vi.fn(async () => undefined),
      },
      limiter: { consume: vi.fn(async () => true) },
    });

    const result = await service.recommend(
      { id: 99, type: "movie" },
      "client-1",
    );

    expect(result).toEqual({
      source: "tmdb",
      recommendations: [{ movie: fallbackMovie }],
      notice: "AI recommendations are unavailable, so standard TMDB matches are shown.",
    });
  });

  it("falls back to TMDB when the AI request times out", async () => {
    const fallbackMovie = movie(8, "Timeout Fallback");
    const service = createAiRecommendationService({
      loadSeed: vi.fn(async () => ({
        id: 99,
        type: "movie" as const,
        title: "Seed",
        release: 2024,
        overview: "Overview",
        genres: [],
        keywords: [],
        creators: [],
        cast: [],
      })),
      generateCandidates: vi.fn(async () => {
        throw new Error("Timeout after 10000ms");
      }),
      resolveCandidate: vi.fn(),
      loadFallback: vi.fn(async () => [fallbackMovie]),
      cache: {
        get: vi.fn(async () => null),
        set: vi.fn(async () => undefined),
      },
      limiter: { consume: vi.fn(async () => true) },
    });

    await expect(
      service.recommend({ id: 99, type: "movie" }, "client"),
    ).resolves.toMatchObject({
      source: "tmdb",
      recommendations: [{ movie: fallbackMovie }],
    });
  });

  it("removes duplicate and seed results and returns at most ten matches", async () => {
    const seedMovie = movie(99, "Seed");
    const candidates = Array.from({ length: 13 }, (_, index) => ({
      title: `Choice ${index}`,
      year: 2020,
      reason: `Reason ${index}`,
    }));
    let serviceDependenciesCall = 0;
    const service = createAiRecommendationService({
      loadSeed: vi.fn(async () => ({
        id: 99,
        type: "movie" as const,
        title: "Seed",
        release: 2024,
        overview: "Overview",
        genres: [],
        keywords: [],
        creators: [],
        cast: [],
      })),
      generateCandidates: vi.fn(async () => ({ model: "test", candidates })),
      resolveCandidate: vi.fn(async (_candidate, _type) => {
        const call = serviceDependenciesCall++;
        if (call === 0) return seedMovie;
        if (call === 2) return movie(1, "Duplicate");
        return movie(call === 1 ? 1 : call, `Movie ${call}`);
      }),
      loadFallback: vi.fn(async () => []),
      cache: {
        get: vi.fn(async () => null),
        set: vi.fn(async () => undefined),
      },
      limiter: { consume: vi.fn(async () => true) },
    });

    const result = await service.recommend(
      { id: 99, type: "movie" },
      "client",
    );

    expect(result.source).toBe("ai");
    expect(result.recommendations).toHaveLength(10);
    expect(result.recommendations.map(({ movie }) => movie.id)).not.toContain(99);
    expect(new Set(result.recommendations.map(({ movie }) => movie.id)).size).toBe(10);
  });

  it("uses a cached response without consuming the uncached request limit", async () => {
    const cached = {
      source: "ai" as const,
      model: "cached/model",
      recommendations: [{ movie: movie(4, "Cached"), reason: "Still relevant." }],
    };
    const consume = vi.fn(async () => true);
    const service = createAiRecommendationService({
      loadSeed: vi.fn(),
      generateCandidates: vi.fn(),
      resolveCandidate: vi.fn(),
      loadFallback: vi.fn(),
      cache: {
        get: vi.fn(async () => cached),
        set: vi.fn(async () => undefined),
      },
      limiter: { consume },
    });

    await expect(
      service.recommend({ id: 99, type: "movie" }, "client-1"),
    ).resolves.toEqual(cached);
    expect(consume).not.toHaveBeenCalled();
  });
});
