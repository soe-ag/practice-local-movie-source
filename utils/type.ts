export type RawMovie = {
  id: number;
  title?: string;
  name?: string;

  poster_path: string;
  first_air_date?: string;
  release_date?: string;
  media_type: string;
  genre_ids?: number[];
  vote_average: number;
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
};

export type DbMovieWithTotal = {
  totalResults: number;
  movies: DbMovie[];
};

export type LocalList = "watchList" | "favoriteList";
