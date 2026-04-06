import { describe, it, expect } from "vitest";
import type { RawMovie, RawMovieWithTotal } from "~/utils/type";

// convertToDbType relies on Nuxt auto-imported types at compile time only;
// we import it directly — types are erased at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { convertToDbType } = (await import("~/utils/utils")) as any;

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeRaw = (overrides: Partial<RawMovie> = {}): RawMovie => ({
  id: 1,
  title: "Test Movie",
  poster_path: "/abc.jpg",
  media_type: "movie",
  vote_average: 7.859,
  overview: "A test overview.",
  release_date: "2023-06-15",
  ...overrides,
});

const wrapRaw = (items: RawMovie[]): RawMovieWithTotal => ({
  total_results: items.length,
  results: items,
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe("convertToDbType", () => {
  it("returns an empty movie list when results is empty", () => {
    const result = convertToDbType(wrapRaw([]));
    expect(result.totalResults).toBe(0);
    expect(result.movies).toEqual([]);
  });

  it("maps total_results → totalResults", () => {
    const result = convertToDbType(wrapRaw([makeRaw(), makeRaw({ id: 2 })]));
    expect(result.totalResults).toBe(2);
  });

  it("builds full TMDB poster URL from poster_path", () => {
    const result = convertToDbType(
      wrapRaw([makeRaw({ poster_path: "/xyz.jpg" })]),
    );
    expect(result.movies[0].posterUrl).toBe(
      "https://image.tmdb.org/t/p/w300/xyz.jpg",
    );
  });

  it("falls back to default poster when poster_path is falsy", () => {
    // poster_path is typed as string but API can return null/empty
    const result = convertToDbType(
      wrapRaw([makeRaw({ poster_path: "" as unknown as string })]),
    );
    expect(result.movies[0].posterUrl).toBe("/images/default-movie-poster.jpg");
  });

  it("extracts release year from release_date", () => {
    const result = convertToDbType(
      wrapRaw([
        makeRaw({ release_date: "2021-09-01", first_air_date: undefined }),
      ]),
    );
    expect(result.movies[0].release).toBe(2021);
  });

  it("prefers first_air_date year over release_date for TV", () => {
    const result = convertToDbType(
      wrapRaw([
        makeRaw({
          first_air_date: "2019-03-20",
          release_date: "2022-01-01",
          media_type: "tv",
        }),
      ]),
    );
    expect(result.movies[0].release).toBe(2019);
  });

  it("returns null release when both dates are absent", () => {
    const result = convertToDbType(
      wrapRaw([
        makeRaw({ release_date: undefined, first_air_date: undefined }),
      ]),
    );
    expect(result.movies[0].release).toBeNull();
  });

  it("uses title when available", () => {
    const result = convertToDbType(wrapRaw([makeRaw({ title: "My Film" })]));
    expect(result.movies[0].title).toBe("My Film");
  });

  it("falls back to name when title is absent", () => {
    const result = convertToDbType(
      wrapRaw([makeRaw({ title: undefined, name: "My Series" })]),
    );
    expect(result.movies[0].title).toBe("My Series");
  });

  it('falls back to "no title" when both title and name are absent', () => {
    const result = convertToDbType(
      wrapRaw([makeRaw({ title: undefined, name: undefined })]),
    );
    expect(result.movies[0].title).toBe("no title");
  });

  it("rounds vote_average to 1 decimal", () => {
    const result = convertToDbType(wrapRaw([makeRaw({ vote_average: 7.859 })]));
    expect(result.movies[0].rating).toBe(7.9);
  });

  it("sets rating to 0 when vote_average is 0", () => {
    const result = convertToDbType(wrapRaw([makeRaw({ vote_average: 0 })]));
    expect(result.movies[0].rating).toBe(0);
  });

  it("truncates overview longer than 220 chars and appends ' ...'", () => {
    const long = "x".repeat(230);
    const result = convertToDbType(wrapRaw([makeRaw({ overview: long })]));
    expect(result.movies[0].overview).toBe(`${"x".repeat(220)} ...`);
  });

  it("keeps overview shorter than 220 chars unchanged", () => {
    const short = "Short description.";
    const result = convertToDbType(wrapRaw([makeRaw({ overview: short })]));
    expect(result.movies[0].overview).toBe(short);
  });

  it("sets overview to empty string when absent", () => {
    const result = convertToDbType(wrapRaw([makeRaw({ overview: "" })]));
    expect(result.movies[0].overview).toBe("");
  });

  it("uses media_type as type", () => {
    const result = convertToDbType(wrapRaw([makeRaw({ media_type: "tv" })]));
    expect(result.movies[0].type).toBe("tv");
  });

  it("falls back to movie type when media_type is missing", () => {
    const result = convertToDbType(
      wrapRaw([makeRaw({ media_type: undefined as unknown as string })]),
    );
    expect(result.movies[0].type).toBe("movie");
  });

  it("sets addedAt as a Date for each mapped movie", () => {
    const result = convertToDbType(wrapRaw([makeRaw(), makeRaw({ id: 2 })]));
    expect(result.movies[0].addedAt).toBeInstanceOf(Date);
    expect(result.movies[1].addedAt).toBeInstanceOf(Date);
  });
});
