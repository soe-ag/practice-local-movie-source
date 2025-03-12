<script setup lang="ts">
import type { DbMovie } from "~/utils/type";

const props = defineProps<{
  list: DbMovie[];
  isList: boolean;
}>();

const emit = defineEmits<{
  (e: "removeFromList", id: number, title: string): void;
  (e: "addMovie", item: DbMovie, dbName: string): void;
}>();
</script>

<template>
  <div
    v-for="item in props.list"
    :key="item.id"
    class="w-40 h-64 m-2 flex flex-col"
  >
    <!-- max-md:w-36 max-md:h-58 -->
    <div class="flex gap-2">
      <NuxtImg :src="item.posterUrl" class="rounded-1 w-40 h-56" />
      <!-- class="rounded-1 w-35 max-md:w-30 max-md:h-45" -->

      <div class="p-1 flex flex-col justify-between absolute w-40 h-56">
        <div class="flex justify-end">
          <div
            v-if="item.rating !== 0"
            class="i-material-symbols-stat-0-rounded drop-shadow-xl"
          />
          <div
            v-if="item.rating"
            class="text-xs text-white drop-shadow-xl font-semibold"
          >
            <span>{{ item.rating === 0 ? "-" : item.rating }}</span>
          </div>
        </div>
        <div class="flex justify-end">
          <div v-if="props.isList" class="max-md:w-4">
            <div
              class="i-material-symbols-favorite text-gray text-xl cursor-pointer hover:text-red mb-1 mx-auto hover:animate-bounce"
              @click="emit('addMovie', item, 'favoriteList')"
            />

            <div
              class="i-material-symbols-add-rounded text-gray text-xl cursor-pointer hover:text-green mx-auto hover:animate-pulse"
              @click="emit('addMovie', item, 'watchList')"
            />
          </div>
          <div
            v-else
            class="i-material-symbols-delete-forever-outline-rounded text-gray text-xl max-md:text-lg cursor-pointer hover:text-red hover:animate-pulse"
            @click="emit('removeFromList', item.id, item.title)"
          />
        </div>
      </div>
    </div>
    <div class="text-xs my-1">{{ item.title }} ({{ item.release ?? "-" }})</div>
  </div>
</template>
