import { describe, expect, it } from "vitest";
import { parseRecommendationRequest } from "~/server/utils/recommendationRequest";

describe("AI recommendation endpoint request", () => {
  it("accepts a positive TMDB id and supported media type", () => {
    expect(parseRecommendationRequest({ id: 42, type: "movie" })).toEqual({
      id: 42,
      type: "movie",
    });
  });

  it.each([
    {},
    { id: 0, type: "movie" },
    { id: 1.2, type: "movie" },
    { id: 42, type: "person" },
  ])("rejects invalid input %#", (input) => {
    expect(() => parseRecommendationRequest(input)).toThrow();
  });
});
