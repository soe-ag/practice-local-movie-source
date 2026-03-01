<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { api } from "~/convex/_generated/api";

const toast = useToast();
const showToast = (type: "error" | "success", message: string) => {
  toast.add({
    severity: type,
    summary: type === "error" ? "Error" : "Success",
    detail:
      type === "error"
        ? message
        : `Movie (${message}) is removed from Favorite list.`,
    life: 3000,
  });
};

// Use Convex query to fetch favorite list
const { data: favoriteListData } = useConvexQuery(api.favoriteList.get);

// Transform Convex data to DbMovie format
const saveList = computed<DbMovie[]>(() => {
  if (!favoriteListData.value) return [];

  return favoriteListData.value.map((movie) => {
    // Convert addedAt from number/string to Date
    let addedAt: Date;
    if (typeof movie.addedAt === "number") {
      addedAt = new Date(movie.addedAt);
    } else if (typeof movie.addedAt === "string") {
      addedAt = new Date(movie.addedAt);
    } else {
      addedAt = new Date();
    }

    return {
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      rating: movie.rating,
      release: movie.release,
      type: movie.type,
      addedAt,
      overview: movie.overview,
    };
  });
});

const { mutate: removeFromFavorites } = useConvexMutation(
  api.favoriteList.remove
);

const removeFromFavoriteList = async (id: number, name: string) => {
  try {
    await removeFromFavorites({ id });
    showToast("success", name);
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.toString() || "Failed to remove movie";
    showToast("error", errorMessage);
    console.error(error);
  }
};

type Sort = "ascending" | "descending" | null;
const sortDate = ref<Sort>(null);
const sortYear = ref<Sort>(null);
const sortRating = ref<Sort>(null);

const handleSortDateAdded = () => {
  sortDate.value = sortDate.value === "ascending" ? "descending" : "ascending";
  sortYear.value = null;
  sortRating.value = null;

  saveList.value.sort((a, b) => {
    const dateA = a.addedAt ? new Date(a.addedAt) : null;
    const dateB = b.addedAt ? new Date(b.addedAt) : null;

    if (!dateA || !dateB) return 0;

    return sortDate.value === "ascending"
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
};

const handleSortYear = () => {
  sortYear.value = sortYear.value === "ascending" ? "descending" : "ascending";
  sortDate.value = null;
  sortRating.value = null;

  saveList.value.sort((a, b) => {
    if (!a.release || !b.release) return 0;
    return sortYear.value === "ascending"
      ? a.release - b.release
      : b.release - a.release;
  });
};
const handleSortRating = () => {
  sortRating.value =
    sortRating.value === "ascending" ? "descending" : "ascending";
  sortDate.value = null;
  sortYear.value = null;

  saveList.value.sort((a, b) => {
    if (!a.rating || !b.rating) return 0;
    return sortRating.value === "ascending"
      ? a.rating - b.rating
      : b.rating - a.rating;
  });
};
</script>

<template>
  <div class="py-2">
    <Toast class="font-sans" />
    <div class="flex gap-4 mx-4 justify-end text-sm">
      <div>Sorted By:</div>
      <div
        class="cursor-pointer hover:text-blue flex items-center"
        :class="{
          'font-bold text-blue': sortDate !== null,
        }"
        @click="() => handleSortDateAdded()"
      >
        Date Added
        <div
          v-if="sortDate === 'ascending'"
          class="i-material-symbols-arrow-upward-alt"
        />
        <div
          v-if="sortDate === 'descending'"
          class="i-material-symbols-arrow-downward-alt"
        />
      </div>
      <div
        class="cursor-pointer hover:text-blue flex items-center"
        :class="{
          'font-bold text-blue': sortYear !== null,
        }"
        @click="() => handleSortYear()"
      >
        Year
        <div
          v-if="sortYear === 'ascending'"
          class="i-material-symbols-arrow-upward-alt"
        />
        <div
          v-if="sortYear === 'descending'"
          class="i-material-symbols-arrow-downward-alt"
        />
      </div>
      <div
        class="cursor-pointer hover:text-blue flex items-center"
        :class="{
          'font-bold text-blue': sortRating !== null,
        }"
        @click="() => handleSortRating()"
      >
        Rating
        <div
          v-if="sortRating === 'ascending'"
          class="i-material-symbols-arrow-upward-alt"
        />
        <div
          v-if="sortRating === 'descending'"
          class="i-material-symbols-arrow-downward-alt"
        />
      </div>
    </div>
    <div
      v-if="saveList.length"
      class="flex flex-wrap gap-2 justify-center items-center mx-4"
    >
      <ItemDumb
        :list="saveList"
        :is-list="false"
        @remove-from-list="removeFromFavoriteList"
      />
    </div>
    <div v-else class="mx-4">No favorite movies.</div>
  </div>
</template>
