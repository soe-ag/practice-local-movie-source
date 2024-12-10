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
        : `Movie (${message}) is removed from Watchlist.`,
    life: 3000,
  });
};

const { data, refresh } = await useAsyncData<DbMovie[]>(
  "fetchWatchList",
  async () => {
    const { data } = await client.from("watchList").select();
    return data as DbMovie[];
  }
);

const watchList = computed<DbMovie[]>(() => {
  return data.value ?? [];
});

const removeFromWatchList = async (id: number, name: string) => {
  console.log(id);
  const { error } = await client.from("watchList").delete().eq("id", id);
  showToast(error ? "error" : "success", error ? error.message : name);
  console.log(error);

  refresh();
};

type Sort = "ascending" | "descending" | null;
const sortDate = ref<Sort>(null);
const sortYear = ref<Sort>(null);
const sortRating = ref<Sort>(null);
const handleSortDateAdded = () => {
  sortDate.value = sortDate.value === "ascending" ? "descending" : "ascending";
  sortYear.value = null;
  sortRating.value = null;

  watchList.value.sort((a, b) => {
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

  watchList.value.sort((a, b) => {
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

  watchList.value.sort((a, b) => {
    if (!a.rating || !b.rating) return 0;
    return sortRating.value === "ascending"
      ? a.rating - b.rating
      : b.rating - a.rating;
  });
};
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
        v-if="watchList.length"
        class="flex flex-wrap gap-2 justify-center items-center mx-4"
      >
        <div
          v-for="item in watchList"
          :key="item.id"
          class="w-50 h-70 m-2 p-1 flex flex-col max-md:w-36 max-md:h-58"
        >
          <div class="flex gap-2">
            <NuxtImg
              :src="item.posterUrl"
              class="rounded-1 w-35 max-md:w-30 max-md:h-45"
            />
            <div class="flex flex-col gap-2 justify-between">
              <div>
                <div>
                  <div
                    v-if="item.rating"
                    class="px-2 text-xs rounded-full bg-blue!"
                  >
                    {{ item.rating }}
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div
                  class="i-material-symbols-delete-forever text-gray text-2xl max-md:text-lg cursor-pointer hover:text-red hover:animate-pulse"
                  @click="() => removeFromWatchList(item.id, item.title)"
                />
              </div>
            </div>
          </div>
          <div class="text-sm my-1">
            {{ item.title }} ({{ item.release ?? "-" }})
          </div>
        </div>
      </div>
      <div v-else class="mx-4">No movies in watch list.</div>
    </div>
  </div>
</template>
