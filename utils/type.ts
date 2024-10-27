export type RawMovie = {
  id: number;
  title?: string;
  name?: string;

  poster_path: string;
  first_air_date?: string;
  release_date?: string;
  media_type: string;
  vote_average: number;
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
  addedAt: Date;
};

export type DbMovieWithTotal = {
  totalResults: number;
  movies: DbMovie[];
};

export type LocalList = "watchList" | "favoriteList";
