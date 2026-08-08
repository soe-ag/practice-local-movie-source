<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { useToast } from "primevue/usetoast";
import { api } from "~/convex/_generated/api";

const props = withDefaults(
  defineProps<{
    list: DbMovie[];
    isLarge?: boolean;
  }>(),
  { isLarge: false },
);

const toast = useToast();
const { mutate: addToWatchList } = useConvexMutation(api.watchList.add);
const { mutate: addToFavoriteList } = useConvexMutation(api.favoriteList.add);

const showToast = (
  type: "error" | "success",
  message: string,
  dbName?: string,
) => {
  toast.add({
    severity: type,
    summary: type === "error" ? "Error" : "Success",
    detail:
      type === "error" ? message : `Movie (${message}) is added to ${dbName}.`,
    life: 3000,
  });
};

const addMovie = async (item: DbMovie, dbName: string) => {
  try {
    // Prepare movie data (addedAt is set automatically by Convex mutations)
    const movieData = {
      id: item.id,
      title: item.title,
      posterUrl: item.posterUrl,
      rating: item.rating,
      release: item.release,
      type: item.type,
      genres: item.genres,
      overview: item.overview,
    };

    if (dbName === "watchList") {
      await addToWatchList(movieData);
    } else if (dbName === "favoriteList") {
      await addToFavoriteList(movieData);
    }

    showToast("success", item.title, dbName);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error) || "Failed to add movie";
    showToast("error", errorMessage, "");
    console.error(error);
  }
};
</script>

<template>
  <div v-if="props.isLarge" class="w-full max-w-[1920px] mx-auto mt-4 mb-0">
    <ItemLarge :list="props.list" is-list @add-movie="addMovie" />
  </div>
  <div
    v-else
    class="flex flex-wrap justify-center sm:justify-start items-start px-2 md:px-8 max-w-[1400px] mx-auto"
  >
    <ItemDumb :list="props.list" is-list @add-movie="addMovie" />
  </div>
</template>
