<script setup lang="ts">
import type { DbMovie } from "~/utils/type";

const client = useSupabaseClient();

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

const { data, refresh } = await useAsyncData<DbMovie[]>(
  "favoriteList",
  async () => {
    const { data } = await client.from("favoriteList").select();
    return data as DbMovie[];
  }
);

const saveList = computed<DbMovie[]>(() => {
  return data.value ?? [];
});

const removeFromFavoriteList = async (id: number, name: string) => {
  console.log(id);
  const { error } = await client.from("favoriteList").delete().eq("id", id);
  showToast(error ? "error" : "success", error ? error.message : name);
  console.log(error);

  refresh();
};

type Sort = "ascending" | "descending" | null;
const sortYear = ref<Sort>(null);
const sortRating = ref<Sort>(null);

const handleSortYear = () => {
  sortYear.value = sortYear.value === "ascending" ? "descending" : "ascending";
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
