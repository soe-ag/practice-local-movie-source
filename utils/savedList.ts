import type { DbMovie } from "~/utils/type";

const TMDB_POSTER_SIZE = "w300";
const DEFAULT_POSTER = "/images/default-movie-poster.jpg";

export const toDisplayPosterUrl = (posterValue: string): string => {
  if (!posterValue) return DEFAULT_POSTER;
  if (/^https?:\/\//.test(posterValue) || posterValue.startsWith("/images/")) {
    return posterValue;
  }
  const path = posterValue.startsWith("/") ? posterValue : `/${posterValue}`;
  return `https://image.tmdb.org/t/p/${TMDB_POSTER_SIZE}${path}`;
};

export type SavedMovieRecord = {
  id: number;
  title: string;
  posterUrl: string;
  rating: number;
  release: number | null;
  type: string;
  genres?: string[];
  overview?: string;
  addedAt?: number | string;
};

export const savedMovieToDbMovie = (movie: SavedMovieRecord): DbMovie => ({
  id: movie.id,
  title: movie.title,
  posterUrl: toDisplayPosterUrl(movie.posterUrl),
  rating: movie.rating,
  release: movie.release,
  type: movie.type,
  genres: movie.genres ?? [],
  overview: movie.overview,
  addedAt: movie.addedAt === undefined ? new Date() : new Date(movie.addedAt),
});

export type SortKey = "date" | "year" | "rating";
export type SortDirection = "ascending" | "descending";
export type SortState = { key: SortKey; direction: SortDirection } | null;

export type SavedListFilters = {
  type: string;
  rating: string;
  year: string;
};

export const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Series" },
];

export const RATING_FILTER_OPTIONS = [
  { value: "", label: "All Ratings" },
  { value: "lt7", label: "Less than 7" },
  { value: "7-7.5", label: "7 ~ 7.5" },
  { value: "7.5-8", label: "7.5 ~ 8" },
  { value: "gt8", label: "Above 8" },
];

export const YEAR_FILTER_OPTIONS = [
  { value: "", label: "All Years" },
  { value: "lt2000", label: "Before 2000" },
  { value: "2000-2010", label: "2000 ~ 2010" },
  { value: "2010-2020", label: "2010 ~ 2020" },
  { value: "2020-2030", label: "2020 ~ 2030" },
];

const matchesRating = (rating: number, filter: string): boolean => {
  if (filter === "lt7") return rating < 7;
  if (filter === "7-7.5") return rating >= 7 && rating < 7.5;
  if (filter === "7.5-8") return rating >= 7.5 && rating <= 8;
  if (filter === "gt8") return rating > 8;
  return true;
};

const matchesYear = (year: number, filter: string): boolean => {
  if (!year) return false;
  if (filter === "lt2000") return year < 2000;
  if (filter === "2000-2010") return year >= 2000 && year < 2010;
  if (filter === "2010-2020") return year >= 2010 && year < 2020;
  if (filter === "2020-2030") return year >= 2020 && year <= 2030;
  return true;
};

export const filterSavedList = (
  list: DbMovie[],
  filters: SavedListFilters,
): DbMovie[] =>
  list.filter(
    (item) =>
      (!filters.type || item.type === filters.type) &&
      (!filters.rating || matchesRating(item.rating || 0, filters.rating)) &&
      (!filters.year || matchesYear(item.release || 0, filters.year)),
  );

const sortValue = (item: DbMovie, key: SortKey): number => {
  if (key === "date") return item.addedAt ? new Date(item.addedAt).getTime() : 0;
  if (key === "year") return item.release || 0;
  return item.rating || 0;
};

export const sortSavedList = (list: DbMovie[], sort: SortState): DbMovie[] => {
  if (!sort) return list;
  const direction = sort.direction === "ascending" ? 1 : -1;
  return [...list].sort(
    (a, b) => (sortValue(a, sort.key) - sortValue(b, sort.key)) * direction,
  );
};

/** First click sorts ascending; clicking the active key flips direction. */
export const toggleSort = (current: SortState, key: SortKey): SortState => ({
  key,
  direction:
    current?.key === key && current.direction === "ascending"
      ? "descending"
      : "ascending",
});
