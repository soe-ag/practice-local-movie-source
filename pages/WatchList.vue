<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { api } from "~/convex/_generated/api";

const toast = useToast();

const { data: watchListData } = useConvexQuery(api.watchList.get);
const isPending = computed(() => watchListData.value === undefined);
const watchList = computed<DbMovie[]>(() =>
  (watchListData.value ?? []).map(savedMovieToDbMovie),
);

const { mutate: removeFromWatchListMutation } = useConvexMutation(api.watchList.remove);

const removeFromWatchList = async (id: number, type: string, name: string) => {
  try {
    await removeFromWatchListMutation({ id, type });
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Movie (${name}) is removed from Watchlist.`,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error instanceof Error ? error.message : "Failed to remove movie",
      life: 3000,
    });
    console.error(error);
  }
};
</script>

<template>
  <div>
    <Toast class="font-sans" />
    <SavedListView
      :list="watchList"
      :pending="isPending"
      empty-text="No movies in watch list."
      sort-by-date-added
      @remove-from-list="removeFromWatchList"
    />
  </div>
</template>
