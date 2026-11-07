export type HomeMediaType = "movie" | "tv";

export type HomeFilters = {
  type: HomeMediaType;
  /** TMDB genre id as a string, or "" for all genres. */
  genre: string;
  /** Minimum vote average as a string, or "" for any rating. */
  minRating: string;
  /** Release-year bucket (same values as the saved lists), or "" for any year. */
  year: string;
};

export const DEFAULT_HOME_FILTERS: HomeFilters = {
  type: "movie",
  genre: "",
  minRating: "",
  year: "",
};

/** Inclusive release-date range per year bucket; matches filterSavedList's buckets. */
export const HOME_YEAR_RANGES: Record<string, { from?: string; to: string }> = {
  lt2000: { to: "1999-12-31" },
  "2000-2010": { from: "2000-01-01", to: "2009-12-31" },
  "2010-2020": { from: "2010-01-01", to: "2019-12-31" },
  "2020-2030": { from: "2020-01-01", to: "2030-12-31" },
};

export const HOME_TYPE_OPTIONS: { value: HomeMediaType; label: string }[] = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Series" },
];

export const HOME_MIN_RATING_OPTIONS = [
  { value: "", label: "Any Rating" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
];

/** True when the filters differ from the default "popular movies" view. */
export const isHomeFilterActive = (filters: HomeFilters): boolean =>
  filters.type !== DEFAULT_HOME_FILTERS.type ||
  filters.genre !== "" ||
  filters.minRating !== "" ||
  filters.year !== "";
