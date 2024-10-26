export type SaveType = {
  id: number;
  title?: string;
  name?: string;

  poster_path: string;
  vote_average: number;
};

export type Item = {
  id: number;
  title: string;
  posterUrl: string;
  rating: number;
  release: number; // year only
};

export type LocalList = "watchList" | "favoriteList";
