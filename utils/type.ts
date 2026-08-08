export type RawMovie = {
  id: number;
  title?: string;
  name?: string;

  poster_path: string;
  first_air_date?: string;
  release_date?: string;
  media_type?: string;
  genre_ids?: number[];
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  overview: string;
};

export type RawMovieWithTotal = {
  total_results: number;
  results: RawMovie[];
};

export type DbMovie = {
  id: number;
  title: string;
  posterUrl: string;
  rating: number;
  release: number | null;
  type: string;
  genres: string[];
  addedAt: Date;
  overview?: string;
  voteCount?: number;
  popularity?: number;
};

export type DbMovieWithTotal = {
  totalResults: number;
  movies: DbMovie[];
};

export type LocalList = "watchList" | "favoriteList";

export type MediaType = "movie" | "tv";

export type RecommendationSeed = Pick<
  DbMovie,
  "id" | "title" | "type" | "genres" | "posterUrl"
>;

export type RecommendationGroup = {
  seed: RecommendationSeed;
  candidates: DbMovie[];
};

export type RecommendationCandidate = DbMovie & {
  seedTitles: string[];
  sharedGenres: string[];
  seedMatchCount: number;
  voteCount: number;
  popularity: number;
};

export type RecommendationFilters = {
  type?: string;
  rating?: string;
  genre?: string;
};
