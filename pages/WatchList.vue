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
const isPending = computed(() => watchListData.value === undefined);

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
      genres: movie.genres ?? [],
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
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error) || "Failed to remove movie";
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

const filterType = ref("");
const filterRating = ref("");
const filterYear = ref("");

const filteredList = computed(() => {
  let list = [...watchList.value];

  if (filterType.value) {
    list = list.filter((item) => item.type === filterType.value);
  }

  if (filterRating.value) {
    list = list.filter((item) => {
      const r = item.rating || 0;
      if (filterRating.value === "lt7") return r < 7;
      if (filterRating.value === "7-7.5") return r >= 7 && r < 7.5;
      if (filterRating.value === "7.5-8") return r >= 7.5 && r <= 8.0;
      if (filterRating.value === "gt8") return r > 8.0;
      return true;
    });
  }

  if (filterYear.value) {
    list = list.filter((item) => {
      const y = item.release || 0;
      if (!y) return false;
      if (filterYear.value === "lt2000") return y > 0 && y < 2000;
      if (filterYear.value === "2000-2010") return y >= 2000 && y < 2010;
      if (filterYear.value === "2010-2020") return y >= 2010 && y < 2020;
      if (filterYear.value === "2020-2030") return y >= 2020 && y <= 2030;
      return true;
    });
  }

  return list;
});

const sortedList = computed(() => {
  const list = [...filteredList.value];
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

const resetFilters = () => {
  filterType.value = "";
  filterRating.value = "";
  filterYear.value = "";
  sortDate.value = null;
  sortYear.value = null;
  sortRating.value = null;
};
</script>

<template>
  <div class="py-2">
    <Toast class="font-sans" />
    <div
      class="flex flex-col xl:flex-row gap-4 mx-4 xl:justify-between items-start xl:items-center text-sm mb-4"
    >
      <div class="flex gap-3 items-center flex-wrap">
        <div class="font-semibold text-gray-400">Filter By:</div>
        <select
          v-model="filterType"
          class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Series</option>
        </select>
        <select
          v-model="filterRating"
          class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Ratings</option>
          <option value="lt7">Less than 7</option>
          <option value="7-7.5">7 ~ 7.5</option>
          <option value="7.5-8">7.5 ~ 8</option>
          <option value="gt8">Above 8</option>
        </select>
        <select
          v-model="filterYear"
          class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Years</option>
          <option value="lt2000">Before 2000</option>
          <option value="2000-2010">2000 ~ 2010</option>
          <option value="2010-2020">2010 ~ 2020</option>
          <option value="2020-2030">2020 ~ 2030</option>
        </select>
        <Button
          label="Reset"
          icon="i-material-symbols-restart-alt-rounded"
          size="small"
          severity="secondary"
          class="!py-1 !px-3 !text-xs"
          @click="resetFilters"
        />
      </div>

      <div class="flex gap-4 items-center">
        <div class="font-semibold text-gray-400">Sorted By:</div>
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
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="isPending"
      class="flex flex-wrap justify-start items-start px-2 my-4 md:px-8 max-w-[1400px] mx-auto"
    >
      <ItemSkeleton :count="10" />
    </div>

    <div v-else>
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
