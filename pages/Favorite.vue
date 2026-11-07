<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { api } from "~/convex/_generated/api";

const toast = useToast();

const { data: favoriteListData } = useConvexQuery(api.favoriteList.get);
const isPending = computed(() => favoriteListData.value === undefined);
const favorites = computed<DbMovie[]>(() =>
  (favoriteListData.value ?? []).map(savedMovieToDbMovie),
);

const { mutate: removeFromFavorites } = useConvexMutation(api.favoriteList.remove);

const removeFromFavoriteList = async (id: number, type: string, name: string) => {
  try {
    await removeFromFavorites({ id, type });
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Movie (${name}) is removed from Favorite list.`,
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
      :list="favorites"
      :pending="isPending"
      empty-text="No favorite movies."
      @remove-from-list="removeFromFavoriteList"
    />
  </div>
</template>
