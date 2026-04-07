import { beforeEach, describe, expect, it, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stateStore = new Map<string, { value: any }>();

vi.stubGlobal(
  "useState",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (key: string, init: () => any) => {
    if (!stateStore.has(key)) {
      stateStore.set(key, { value: init() });
    }
    return stateStore.get(key);
  },
);

const { useMovieDrawer } = await import("~/composables/useMovieDrawer");

const sampleMovie = {
  id: 7,
  title: "Drawer Movie",
  posterUrl: "/drawer.jpg",
  rating: 8.1,
  release: 2024,
  type: "movie",
  genres: ["Action", "Drama"],
  addedAt: new Date(1700000000000),
  overview: "drawer overview",
};

describe("useMovieDrawer", () => {
  beforeEach(() => {
    stateStore.clear();
  });

  it("starts closed with no selected movie", () => {
    const { isDrawerOpen, selectedMovie } = useMovieDrawer();

    expect(isDrawerOpen.value).toBe(false);
    expect(selectedMovie.value).toBeNull();
  });

  it("opens drawer and sets selected movie", () => {
    const { isDrawerOpen, selectedMovie, openDrawer } = useMovieDrawer();

    openDrawer(sampleMovie);

    expect(isDrawerOpen.value).toBe(true);
    expect(selectedMovie.value).toEqual(sampleMovie);
  });

  it("closes drawer without clearing selected movie", () => {
    const { isDrawerOpen, selectedMovie, openDrawer, closeDrawer } =
      useMovieDrawer();

    openDrawer(sampleMovie);
    closeDrawer();

    expect(isDrawerOpen.value).toBe(false);
    expect(selectedMovie.value).toEqual(sampleMovie);
  });
});
