import { describe, expect, it } from "vitest";
import {
  buildRecommendationPrompt,
  parseOpenRouterCandidates,
} from "~/server/utils/aiRecommendationAdapters";

describe("AI recommendation adapters", () => {
  it("asks for enriched, same-type recommendations beyond genre matching", () => {
    const prompt = buildRecommendationPrompt({
      id: 1,
      type: "movie",
      title: "Example",
      release: 2020,
      overview: "An intimate journey.",
      genres: ["Drama"],
      keywords: ["identity"],
      creators: ["Director One"],
      cast: ["Actor One"],
    });

    expect(prompt).toContain("An intimate journey.");
    expect(prompt).toContain("identity");
    expect(prompt).toContain("Director One");
    expect(prompt).toContain("Actor One");
    expect(prompt).toContain("same media type");
    expect(prompt).toContain("Do not\nchoose titles merely because they share a genre");
  });

  it("rejects malformed structured output and parses valid candidates", () => {
    expect(() => parseOpenRouterCandidates('{"items":[]}')).toThrow();
    expect(
      parseOpenRouterCandidates(
        JSON.stringify({
          recommendations: [
            { title: "A Film", year: 2019, reason: "A tonal match." },
          ],
        }),
      ),
    ).toEqual([{ title: "A Film", year: 2019, reason: "A tonal match." }]);
  });
});
