import { describe, expect, it } from "vitest";
import {
  filterSavedList,
  savedMovieToDbMovie,
  sortSavedList,
  toDisplayPosterUrl,
  toggleSort,
} from "~/utils/savedList";
import type { DbMovie } from "~/utils/type";

const movie = (overrides: Partial<DbMovie>): DbMovie => ({
  id: 1,
  title: "T",
  posterUrl: "/p.jpg",
  rating: 7.2,
  release: 2005,
  type: "movie",
  genres: [],
  addedAt: new Date(1000),
  ...overrides,
});

describe("toDisplayPosterUrl", () => {
  it("falls back to the default poster", () => {
    expect(toDisplayPosterUrl("")).toBe("/images/default-movie-poster.jpg");
  });
  it("keeps absolute and local image urls", () => {
    expect(toDisplayPosterUrl("https://x/y.jpg")).toBe("https://x/y.jpg");
    expect(toDisplayPosterUrl("/images/a.jpg")).toBe("/images/a.jpg");
  });
  it("builds TMDB urls with or without a leading slash", () => {
    expect(toDisplayPosterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w300/abc.jpg");
    expect(toDisplayPosterUrl("abc.jpg")).toBe("https://image.tmdb.org/t/p/w300/abc.jpg");
  });
});

describe("savedMovieToDbMovie", () => {
  it("maps addedAt, genres and poster", () => {
    const result = savedMovieToDbMovie({
      id: 1, title: "A", posterUrl: "a.jpg", rating: 8, release: 2020, type: "tv", addedAt: 5000,
    });
    expect(result.addedAt).toEqual(new Date(5000));
    expect(result.genres).toEqual([]);
    expect(result.posterUrl).toBe("https://image.tmdb.org/t/p/w300/a.jpg");
  });
});

describe("filterSavedList", () => {
  const list = [
    movie({ id: 1, type: "movie", rating: 6.5, release: 1999 }),
    movie({ id: 2, type: "tv", rating: 7.2, release: 2005 }),
    movie({ id: 3, type: "movie", rating: 8.5, release: null }),
  ];
  const none = { type: "", rating: "", year: "" };

  it("returns everything with no filters", () => {
    expect(filterSavedList(list, none)).toHaveLength(3);
  });
  it("filters by type, rating and year", () => {
    expect(filterSavedList(list, { ...none, type: "tv" }).map((m) => m.id)).toEqual([2]);
    expect(filterSavedList(list, { ...none, rating: "lt7" }).map((m) => m.id)).toEqual([1]);
    expect(filterSavedList(list, { ...none, rating: "gt8" }).map((m) => m.id)).toEqual([3]);
    expect(filterSavedList(list, { ...none, year: "lt2000" }).map((m) => m.id)).toEqual([1]);
  });
  it("excludes items without a release year when filtering by year", () => {
    expect(filterSavedList(list, { ...none, year: "2020-2030" })).toEqual([]);
    expect(filterSavedList(list, { ...none, year: "lt2000" }).map((m) => m.id)).not.toContain(3);
  });
});

describe("sortSavedList / toggleSort", () => {
  const list = [
    movie({ id: 1, rating: 5, release: 2010, addedAt: new Date(300) }),
    movie({ id: 2, rating: 9, release: 1990, addedAt: new Date(100) }),
    movie({ id: 3, rating: 7, release: 2000, addedAt: new Date(200) }),
  ];

  it("keeps order when no sort is active", () => {
    expect(sortSavedList(list, null).map((m) => m.id)).toEqual([1, 2, 3]);
  });
  it("sorts by each key in both directions without mutating the input", () => {
    expect(sortSavedList(list, { key: "rating", direction: "ascending" }).map((m) => m.id)).toEqual([1, 3, 2]);
    expect(sortSavedList(list, { key: "year", direction: "descending" }).map((m) => m.id)).toEqual([1, 3, 2]);
    expect(sortSavedList(list, { key: "date", direction: "ascending" }).map((m) => m.id)).toEqual([2, 3, 1]);
    expect(list.map((m) => m.id)).toEqual([1, 2, 3]);
  });
  it("toggles ascending first, then flips, and resets on a new key", () => {
    const first = toggleSort(null, "year");
    expect(first).toEqual({ key: "year", direction: "ascending" });
    const second = toggleSort(first, "year");
    expect(second).toEqual({ key: "year", direction: "descending" });
    expect(toggleSort(second, "year")).toEqual({ key: "year", direction: "ascending" });
    expect(toggleSort(second, "rating")).toEqual({ key: "rating", direction: "ascending" });
  });
});
