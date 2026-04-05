import type { DbMovie } from "~/utils/type";

export const useMovieDrawer = () => {
  const isDrawerOpen = useState<boolean>("movie-drawer-open", () => false);
  const selectedMovie = useState<DbMovie | null>(
    "movie-drawer-movie",
    () => null,
  );

  const openDrawer = (movie: DbMovie) => {
    selectedMovie.value = movie;
    isDrawerOpen.value = true;
  };

  const closeDrawer = () => {
    isDrawerOpen.value = false;
  };

  return {
    isDrawerOpen,
    selectedMovie,
    openDrawer,
    closeDrawer,
  };
};
