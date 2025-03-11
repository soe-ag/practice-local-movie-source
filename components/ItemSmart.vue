<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { useToast } from "primevue/usetoast";

const props = defineProps<{
  list: DbMovie[];
}>();

const client = useSupabaseClient();
const toast = useToast();
const showToast = (
  type: "error" | "success",
  message: string,
  dbName?: string
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
  const { error } = await client.from(dbName).insert([item]);
  showToast(
    error ? "error" : "success",
    error ? error.message : item.title,
    error ? "" : dbName
  );
  console.log(error);
};
</script>

<template>
  <div
    class="flex flex-wrap gap-2 justify-center items-center m-auto md:w-85vw sm:w-100vw"
  >
    <!-- <div
      v-for="item in props.list"
      :key="item.id"
      class="w-48 h-70 m-2 p-1 flex flex-col max-md:w-36 max-md:h-58"
    >
      <div class="flex gap-2 relative group">
        <NuxtImg
          :src="item.posterUrl"
          class="rounded-1 w-35 max-md:w-30 max-md:h-45"
        />
        <div
          class="px-4 py-8 text-xs line-clamp-3 text-ellipsis absolute inset-0 flex items-center justify-center bg-black/80 text-white rounded-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          {{ item.overview }}
        </div>
        <div
          class="absolute my-1 text-xs flex flex-col justify-end w-7 right-8 items-end gap-1 max-md:right-0"
        >
          <div class="bg-blue rounded-full px-1 text-center mr-0 w-full">
            {{ item.rating === 0 ? "-" : item.rating }}
          </div>
          <div
            v-if="item.type === 'tv'"
            class="px-2 text-xs rounded-full bg-green-5"
          >
            {{ item.type }}
          </div>
        </div>
        <div class="flex flex-col gap-2 justify-between">
          <div>
            <Chip
              v-if="item.vote_average"
              :label="item.vote_average.toFixed(1)"
              class="h-6 text-xs bg-blue!"
            />
          </div>
          <div class="w-8 max-md:w-4">
            <div
              class="i-material-symbols-favorite text-gray text-xl cursor-pointer hover:text-red mb-1 mx-auto hover:animate-bounce"
              @click="() => addMovie(item, 'favoriteList')"
            />

            <div
              class="i-material-symbols-add-rounded text-gray text-xl cursor-pointer hover:text-green mx-auto hover:animate-pulse"
              @click="() => addMovie(item, 'watchList')"
            />
          </div>
        </div>
      </div>
      <div class="my-1 max-md:text-sm">
        {{ item.title }}
        ({{ item.release }})
      </div>
    </div> -->
    <ItemDumb :list="props.list" is-list @add-movie="addMovie" />
  </div>
</template>
