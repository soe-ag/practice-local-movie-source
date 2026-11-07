import { describe, expect, it } from "vitest";
import {
  buildDiscoverParams,
  parseDiscoverRequest,
} from "~/server/utils/discoverRequest";
import { genresForType } from "~/utils/genres";
import { DEFAULT_HOME_FILTERS, isHomeFilterActive } from "~/utils/homeFilters";

describe("parseDiscoverRequest", () => {
  it("defaults to page 1 of movies with no filters", () => {
    expect(parseDiscoverRequest({})).toEqual({
      type: "movie",
      genre: null,
      minRating: null,
      year: null,
      page: 1,
    });
  });

  it("parses type, genre, rating and page", () => {
    expect(
      parseDiscoverRequest({ type: "tv", genre: "10759", minRating: "7", year: "2010-2020", page: "3" }),
    ).toEqual({ type: "tv", genre: 10759, minRating: 7, year: "2010-2020", page: 3 });
  });

  it("treats blank genre and rating as unset", () => {
    expect(parseDiscoverRequest({ genre: "", minRating: "", year: "" })).toMatchObject({
      genre: null,
      minRating: null,
      year: null,
    });
    expect(parseDiscoverRequest({ minRating: "0" }).minRating).toBeNull();
  });

  it("rejects an unknown type", () => {
    expect(() => parseDiscoverRequest({ type: "person" })).toThrow("movie or tv");
  });

  it("rejects a genre that belongs to the other media type", () => {
    // 10759 (Action & Adventure) is TV-only; 28 (Action) is movie-only.
    expect(() => parseDiscoverRequest({ type: "movie", genre: "10759" })).toThrow("genre");
    expect(() => parseDiscoverRequest({ type: "tv", genre: "28" })).toThrow("genre");
    expect(() => parseDiscoverRequest({ genre: "abc" })).toThrow("genre");
  });

  it("rejects out-of-range pages and ratings", () => {
    expect(() => parseDiscoverRequest({ page: "0" })).toThrow("page");
    expect(() => parseDiscoverRequest({ page: "501" })).toThrow("page");
    expect(() => parseDiscoverRequest({ page: "1.5" })).toThrow("page");
    expect(() => parseDiscoverRequest({ minRating: "11" })).toThrow("rating");
    expect(() => parseDiscoverRequest({ minRating: "-1" })).toThrow("rating");
    expect(() => parseDiscoverRequest({ minRating: "abc" })).toThrow("rating");
  });

  it("rejects an unknown year bucket", () => {
    expect(() => parseDiscoverRequest({ year: "1999" })).toThrow("year");
    expect(() => parseDiscoverRequest({ year: "toString" })).toThrow("year");
  });
});

describe("buildDiscoverParams", () => {
  it("sorts by popularity and omits unset filters", () => {
    expect(
      buildDiscoverParams({ type: "movie", genre: null, minRating: null, year: null, page: 2 }),
    ).toEqual({ page: 2, sort_by: "popularity.desc", include_adult: false });
  });

  it("adds a vote-count floor whenever a rating filter is set", () => {
    expect(
      buildDiscoverParams({ type: "tv", genre: 18, minRating: 8, year: null, page: 1 }),
    ).toMatchObject({
      with_genres: 18,
      "vote_average.gte": 8,
      "vote_count.gte": 100,
    });
  });
});

describe("buildDiscoverParams year ranges", () => {
  const base = { genre: null, minRating: null, page: 1 } as const;

  it("uses release date for movies and first air date for TV", () => {
    expect(buildDiscoverParams({ ...base, type: "movie", year: "2000-2010" })).toMatchObject({
      "primary_release_date.gte": "2000-01-01",
      "primary_release_date.lte": "2009-12-31",
    });
    expect(buildDiscoverParams({ ...base, type: "tv", year: "2020-2030" })).toMatchObject({
      "first_air_date.gte": "2020-01-01",
      "first_air_date.lte": "2030-12-31",
    });
  });

  it("only sets an upper bound for the before-2000 bucket", () => {
    const params = buildDiscoverParams({ ...base, type: "movie", year: "lt2000" });
    expect(params).toMatchObject({ "primary_release_date.lte": "1999-12-31" });
    expect(params).not.toHaveProperty("primary_release_date.gte");
  });
});

describe("genresForType", () => {
  it("returns named, type-specific genres", () => {
    const movie = genresForType("movie");
    const tv = genresForType("tv");
    expect(movie.find((g) => g.id === 12)?.name).toBe("Adventure");
    expect(movie.some((g) => g.id === 10759)).toBe(false);
    expect(tv.some((g) => g.id === 10759)).toBe(true);
    expect([...movie, ...tv].every((g) => g.name !== String(g.id))).toBe(true);
  });
});

describe("isHomeFilterActive", () => {
  it("is false for the default view and true for any change", () => {
    expect(isHomeFilterActive(DEFAULT_HOME_FILTERS)).toBe(false);
    expect(isHomeFilterActive({ ...DEFAULT_HOME_FILTERS, type: "tv" })).toBe(true);
    expect(isHomeFilterActive({ ...DEFAULT_HOME_FILTERS, genre: "18" })).toBe(true);
    expect(isHomeFilterActive({ ...DEFAULT_HOME_FILTERS, minRating: "7" })).toBe(true);
    expect(isHomeFilterActive({ ...DEFAULT_HOME_FILTERS, year: "lt2000" })).toBe(true);
  });
});
