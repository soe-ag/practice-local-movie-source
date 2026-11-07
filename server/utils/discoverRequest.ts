import { genresForType } from "~/utils/genres";
import { HOME_YEAR_RANGES } from "~/utils/homeFilters";

export type DiscoverRequest = {
  type: "movie" | "tv";
  genre: number | null;
  minRating: number | null;
  /** Year bucket key from HOME_YEAR_RANGES, or null for any year. */
  year: string | null;
  page: number;
};

const MAX_PAGE = 500; // TMDB rejects pages above 500
const MIN_VOTE_COUNT = 100; // keeps a 10.0 from three votes out of the results

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const isBlank = (value: unknown) => value === undefined || value === null || value === "";

/** Validates /api/tmdb/discover query params. Throws Error with a client-safe message. */
export const parseDiscoverRequest = (query: Record<string, unknown>): DiscoverRequest => {
  const type = first(query.type) ?? "movie";
  if (type !== "movie" && type !== "tv") {
    throw new Error("The type must be movie or tv.");
  }

  const rawPage = first(query.page);
  const page = isBlank(rawPage) ? 1 : Number(rawPage);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new Error("Invalid page.");
  }

  const rawGenre = first(query.genre);
  let genre: number | null = null;
  if (!isBlank(rawGenre)) {
    genre = Number(rawGenre);
    if (!genresForType(type).some((item) => item.id === genre)) {
      throw new Error("Invalid genre for this type.");
    }
  }

  const rawRating = first(query.minRating);
  let minRating: number | null = null;
  if (!isBlank(rawRating)) {
    minRating = Number(rawRating);
    if (!Number.isFinite(minRating) || minRating < 0 || minRating > 10) {
      throw new Error("Invalid minimum rating.");
    }
    if (minRating === 0) minRating = null;
  }

  const rawYear = first(query.year);
  let year: string | null = null;
  if (!isBlank(rawYear)) {
    if (typeof rawYear !== "string" || !Object.hasOwn(HOME_YEAR_RANGES, rawYear)) {
      throw new Error("Invalid year.");
    }
    year = rawYear;
  }

  return { type, genre, minRating, year, page };
};

export const buildDiscoverParams = ({ type, genre, minRating, year, page }: DiscoverRequest) => {
  // Movies filter on release date, TV on first air date.
  const dateField = type === "movie" ? "primary_release_date" : "first_air_date";
  const range = year ? HOME_YEAR_RANGES[year] : null;
  return {
    page,
    sort_by: "popularity.desc",
    include_adult: false,
    ...(genre !== null ? { with_genres: genre } : {}),
    ...(minRating !== null
      ? { "vote_average.gte": minRating, "vote_count.gte": MIN_VOTE_COUNT }
      : {}),
    ...(range?.from ? { [`${dateField}.gte`]: range.from } : {}),
    ...(range ? { [`${dateField}.lte`]: range.to } : {}),
  };
};
