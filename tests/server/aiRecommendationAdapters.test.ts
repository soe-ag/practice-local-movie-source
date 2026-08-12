import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildRecommendationPrompt,
  createOpenRouterAdapter,
  parseOpenRouterCandidates,
} from "~/server/utils/aiRecommendationAdapters";
import {
  AI_RECOMMENDATION_MODEL,
  AI_RECOMMENDATION_TIMEOUT_MS,
} from "~/server/utils/aiRecommendationService";

describe("AI recommendation adapters", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("pins Nemotron Lightning and limits AI waiting to ten seconds", () => {
    expect(AI_RECOMMENDATION_MODEL).toBe(
      "nvidia/nemotron-3.5-lightning:free",
    );
    expect(AI_RECOMMENDATION_TIMEOUT_MS).toBe(10_000);
  });

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

  it("parses JSON wrapped in a markdown code fence", () => {
    expect(
      parseOpenRouterCandidates(
        '```json\n{"recommendations":[{"title":"A Film","year":2019,"reason":"A tonal match."}]}\n```',
      ),
    ).toHaveLength(1);
  });

  it("sends the pinned model with a ten-second transport timeout", async () => {
    const fetcher = vi.fn(
      async (_url: string, _options: Record<string, unknown>) => ({
        model: AI_RECOMMENDATION_MODEL,
        choices: [
          {
            message: {
              content:
                '{"recommendations":[{"title":"A Film","year":2019,"reason":"A tonal match."}]}',
            },
          },
        ],
      }),
    );
    vi.stubGlobal("$fetch", fetcher);

    await createOpenRouterAdapter("test-key").generateCandidates({
      id: 1,
      type: "movie",
      title: "Seed",
      release: 2020,
      overview: "Overview",
      genres: ["Drama"],
      keywords: [],
      creators: [],
      cast: [],
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        timeout: 10_000,
        body: expect.objectContaining({
          model: "nvidia/nemotron-3.5-lightning:free",
          reasoning: { effort: "none" },
        }),
      }),
    );
    const requestOptions = fetcher.mock.calls[0]?.[1] as
      | { body?: Record<string, unknown> }
      | undefined;
    expect(requestOptions?.body).not.toHaveProperty("response_format");
  });
});
