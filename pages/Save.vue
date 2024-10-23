<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { SaveType } from "~/utils/type";

const watchList = ref<SaveType[]>([]);

onMounted(() => {
  const storedList = localStorage.getItem("watchList");
  if (storedList) {
    watchList.value = JSON.parse(storedList);
  }
});

const handleWatchListRemove = (id: number) => {
  watchList.value = removeFromList(id, "watchList");
};
</script>

<template>
  <div>
    <div>
      <div
        v-if="watchList.length"
        class="grid grid-cols-5 gap-2 justify-center items-center m-4"
      >
        <div
          v-for="item in watchList"
          :key="item.id"
          class="w-50 h-70 m-2 p-1 flex flex-col"
        >
          <div class="flex gap-2">
            <NuxtImg
              :src="
                item.poster_path
                  ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                  : '/images/default-movie-poster.jpg'
              "
              class="rounded-1 b-10 b-gray-1"
              width="150"
              height="210"
            />
            <div class="flex flex-col gap-2 justify-between">
              <div>
                <Chip
                  v-if="item.vote_average"
                  :label="item.vote_average.toFixed(1)"
                  class="h-6 text-xs bg-blue!"
                />
              </div>
              <div class="flex flex-col gap-2">
                <div
                  class="i-material-symbols-remove-rounded text-gray text-2xl cursor-pointer hover:text-green"
                  @click="() => handleWatchListRemove(item.id)"
                />
              </div>
            </div>
          </div>
          <div class="text-sm my-1">
            {{ item.title ?? item.name }}
          </div>
        </div>
      </div>
      <div v-else>No saved items.</div>
    </div>
  </div>
</template>
