export type SaveType = {
  id: number;
  title?: string;
  name?: string;

  poster_path: string;
  vote_average: number;
};

export type LocalList = "watchList" | "favoriteList";
