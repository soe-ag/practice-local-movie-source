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
    <div
      class="relative group overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] w-full h-56 flex-shrink-0"
    >
      <NuxtImg
        :src="item.posterUrl"
        class="w-full h-full object-cover"
        placeholder
      />

      <div class="p-0 flex flex-col justify-between absolute inset-0">
        <div class="flex justify-end">
          <div
            v-if="item.rating"
            class="flex items-center gap-1 bg-black/60 backdrop-blur-md pl-2 pr-3 pt-2 pb-1 rounded-bl-xl rounded-tr-sm shadow-lg m-[-4px]"
          >
            <div
              class="i-material-symbols-star-rounded text-yellow-400 text-[10px]"
            />
            <span class="text-[11px] text-white font-bold">{{
              item.rating.toFixed(1)
            }}</span>
          </div>
        </div>
        <div class="flex justify-end">
          <div
            class="bg-black/60 backdrop-blur-md p-1.5 rounded-tl-xl rounded-br-sm shadow-lg flex flex-col gap-1 items-center m-[-4px]"
          >
            <div v-if="props.isList" class="flex flex-col gap-1">
              <button
                type="button"
                class="i-material-symbols-favorite text-gray-300 text-lg cursor-pointer hover:text-red-500 transition-colors hover:animate-bounce"
                :aria-label="`Add ${item.title} to favorites`"
                :title="`Add ${item.title} to favorites`"
                @click="emit('addMovie', item, 'favoriteList')"
              />

              <button
                type="button"
                class="i-material-symbols-add-rounded text-gray-300 text-lg cursor-pointer hover:text-green-500 transition-colors hover:animate-pulse"
                :aria-label="`Add ${item.title} to watchlist`"
                :title="`Add ${item.title} to watchlist`"
                @click="emit('addMovie', item, 'watchList')"
              />
            </div>
            <button
              v-else
              type="button"
              class="i-material-symbols-delete-forever-outline-rounded text-gray-300 text-lg cursor-pointer hover:text-red-500 transition-colors hover:animate-pulse"
              :aria-label="`Remove ${item.title} from list`"
              :title="`Remove ${item.title} from list`"
              @click="emit('removeFromList', item.id, item.title)"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="text-xs my-1">{{ item.title }} ({{ item.release ?? "-" }})</div>
  </div>
</template>
