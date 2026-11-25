import type { DbMovie } from "~/utils/type";

export const useMovieDrawer = () => {
  const isDrawerOpen = useState<boolean>("movie-drawer-open", () => false);
  const selectedMovie = useState<DbMovie | null>(
    "movie-drawer-movie",
    () => null,
  );
  const showAddActions = useState<boolean>("movie-drawer-show-add-actions", () => true);

  const openDrawer = (movie: DbMovie, canAddToLists = true) => {
    selectedMovie.value = movie;
    showAddActions.value = canAddToLists;
    isDrawerOpen.value = true;
  };

  const closeDrawer = () => {
    isDrawerOpen.value = false;
  };

  return {
    isDrawerOpen,
    selectedMovie,
    showAddActions,
    openDrawer,
    closeDrawer,
  };
};
