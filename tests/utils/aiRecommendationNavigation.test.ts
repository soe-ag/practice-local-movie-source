import { describe, expect, it } from "vitest";
import {
  buildAiRecommendationRoute,
  parseAiRecommendationRoute,
} from "~/utils/aiRecommendationNavigation";

describe("AI recommendation navigation", () => {
  it("round-trips the added title into a Find Similar route seed", () => {
    const route = buildAiRecommendationRoute({ id: 42, type: "movie" });

    expect(route).toEqual({
      path: "/recommendations",
      query: { tab: "findSimilar", id: "42", type: "movie" },
    });
    expect(parseAiRecommendationRoute(route.query)).toEqual({
      id: 42,
      type: "movie",
    });
  });

  it("rejects unrelated or malformed query parameters", () => {
    expect(parseAiRecommendationRoute({ tab: "forYou", id: "42" })).toBeNull();
    expect(
      parseAiRecommendationRoute({
        tab: "findSimilar",
        id: "bad",
        type: "movie",
      }),
    ).toBeNull();
  });
});
