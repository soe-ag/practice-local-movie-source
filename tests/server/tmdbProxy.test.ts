import { describe, expect, it } from "vitest";
import { keepMoviesAndTv, parseTrendingWindow } from "~/server/utils/tmdbProxy";
import { DEFAULT_HOME_FILTERS, isHomeFilterActive } from "~/utils/homeFilters";

describe("parseTrendingWindow", () => {
  it("defaults to the weekly list", () => {
    expect(parseTrendingWindow(undefined)).toBe("week");
    expect(parseTrendingWindow("")).toBe("week");
  });

  it("accepts day and week", () => {
    expect(parseTrendingWindow("day")).toBe("day");
    expect(parseTrendingWindow("week")).toBe("week");
    expect(parseTrendingWindow(["day"])).toBe("day");
  });

  it("rejects anything else", () => {
    expect(() => parseTrendingWindow("month")).toThrow();
    expect(() => parseTrendingWindow("toString")).toThrow();
  });
});

describe("keepMoviesAndTv", () => {
  it("drops people and untyped items, keeping order and other fields", () => {
    const response = {
      page: 2,
      total_results: 1000,
      results: [
        { id: 1, media_type: "movie" },
        { id: 2, media_type: "person" },
        { id: 3, media_type: "tv" },
        { id: 4 },
      ],
    };
    expect(keepMoviesAndTv(response)).toEqual({
      page: 2,
      total_results: 1000,
      results: [
        { id: 1, media_type: "movie" },
        { id: 3, media_type: "tv" },
      ],
    });
  });
});

describe("default home view", () => {
  it("is trending movies and TV, with no type chosen", () => {
    expect(DEFAULT_HOME_FILTERS.type).toBe("");
    expect(isHomeFilterActive(DEFAULT_HOME_FILTERS)).toBe(false);
    expect(isHomeFilterActive({ ...DEFAULT_HOME_FILTERS, type: "movie" })).toBe(true);
  });
});
