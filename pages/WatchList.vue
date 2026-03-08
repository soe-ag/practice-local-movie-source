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
        : `Movie (${message}) is removed from Watchlist.`,
    life: 3000,
  });
};

// Use Convex query to fetch watchlist
const { data: watchListData } = useConvexQuery(api.watchList.get);

// Transform Convex data to DbMovie format
const watchList = computed<DbMovie[]>(() => {
  if (!watchListData.value) return [];

  return watchListData.value.map((movie) => {
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

const { mutate: removeFromWatchListMutation } = useConvexMutation(
  api.watchList.remove,
);

const removeFromWatchList = async (id: number, name: string) => {
  try {
    await removeFromWatchListMutation({ id });
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
};

const handleSortYear = () => {
  sortYear.value = sortYear.value === "ascending" ? "descending" : "ascending";
  sortDate.value = null;
  sortRating.value = null;
};

const handleSortRating = () => {
  sortRating.value =
    sortRating.value === "ascending" ? "descending" : "ascending";
  sortDate.value = null;
  sortYear.value = null;
};

const sortedList = computed(() => {
  const list = [...watchList.value];
  if (sortDate.value !== null) {
    list.sort((a, b) => {
      const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return sortDate.value === "ascending" ? dateA - dateB : dateB - dateA;
    });
  } else if (sortYear.value !== null) {
    list.sort((a, b) => {
      const yearA = a.release || 0;
      const yearB = b.release || 0;
      return sortYear.value === "ascending" ? yearA - yearB : yearB - yearA;
    });
  } else if (sortRating.value !== null) {
    list.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return sortRating.value === "ascending"
        ? ratingA - ratingB
        : ratingB - ratingA;
    });
  }
  return list;
});
</script>

<template>
  <div class="bg-#0e1111 py-2">
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
    <div>
      <div
        v-if="sortedList.length"
        class="flex flex-wrap justify-start items-start px-2 my-4 md:px-8 max-w-[1400px] mx-auto"
      >
        <ItemDumb
          :list="sortedList"
          :is-list="false"
          @remove-from-list="removeFromWatchList"
        />
      </div>
      <div v-else class="mx-4">No movies in watch list.</div>
    </div>
  </div>
</template>
