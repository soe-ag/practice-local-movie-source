<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { ref, computed } from "vue";

const hoverIndex = ref<number | null>(null);

const props = defineProps<{
  list: DbMovie[];
  isList: boolean;
}>();

const emit = defineEmits<{
  (e: "removeFromList", id: number, title: string): void;
  (e: "addMovie", item: DbMovie, dbName: string): void;
}>();

// Always 5 items per row
const itemsPerRow = computed(() => 5);

const chunkedList = computed(() => {
  const chunks = [];
  if (props.list.length > 0) {
    for (let i = 0; i < props.list.length; i += itemsPerRow.value) {
      chunks.push(props.list.slice(i, i + itemsPerRow.value));
    }
  }
  return chunks;
});
</script>

<template>
  <div
    class="flex flex-col gap-3 sm:gap-4 w-full pt-12 pb-0 px-2 overflow-x-hidden"
  >
    <div
      v-for="(row, rowIndex) in chunkedList"
      :key="rowIndex"
      class="stacked-row"
    >
      <div
        v-for="(item, index) in row"
        :key="item.id"
        class="stacked-item drop-shadow-lg flex flex-col group/card"
        :style="{ zIndex: hoverIndex === item.id ? 100 : 50 - index }"
        @mouseenter="hoverIndex = item.id"
        @mouseleave="hoverIndex = null"
      >
        <div
          class="relative overflow-hidden rounded-lg transition-all duration-300 w-full aspect-[2/3] flex-shrink-0"
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
                class="flex items-center gap-1 bg-black/60 backdrop-blur-md pl-2 pr-3 pt-2 pb-1.5 rounded-bl-xl rounded-tr-sm shadow-lg m-[-4px]"
              >
                <div
                  class="i-material-symbols-star-rounded text-yellow-400 text-sm"
                />
                <span class="text-xs text-white font-bold">{{
                  item.rating.toFixed(1)
                }}</span>
              </div>
            </div>
            <div class="flex justify-end">
              <div
                class="bg-black/60 backdrop-blur-md p-2 rounded-tl-xl rounded-br-sm shadow-lg flex flex-col gap-2 items-center m-[-4px]"
              >
                <div v-if="props.isList" class="flex flex-col gap-2">
                  <button
                    type="button"
                    class="i-material-symbols-favorite text-gray-300 text-2xl cursor-pointer hover:text-red-500 transition-colors hover:animate-bounce"
                    :aria-label="`Add ${item.title} to favorites`"
                    :title="`Add ${item.title} to favorites`"
                    @click="emit('addMovie', item, 'favoriteList')"
                  />

                  <button
                    type="button"
                    class="i-material-symbols-add-rounded text-gray-300 text-2xl cursor-pointer hover:text-green-500 transition-colors hover:animate-pulse"
                    :aria-label="`Add ${item.title} to watchlist`"
                    :title="`Add ${item.title} to watchlist`"
                    @click="emit('addMovie', item, 'watchList')"
                  />
                </div>
                <button
                  v-else
                  type="button"
                  class="i-material-symbols-delete-forever-outline-rounded text-gray-300 text-2xl cursor-pointer hover:text-red-500 transition-colors hover:animate-pulse"
                  :aria-label="`Remove ${item.title} from list`"
                  :title="`Remove ${item.title} from list`"
                  @click="emit('removeFromList', item.id, item.title)"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          class="text-sm font-bold mt-3 whitespace-nowrap overflow-hidden text-ellipsis px-1 drop-shadow-sm text-center w-full block"
        >
          {{ item.title }}
        </div>
        <div
          class="text-xs text-gray-500 dark:text-gray-400 px-1 font-medium text-center w-full block"
        >
          {{ item.release ?? "-" }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stacked-row {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  width: 100%;
  padding: 20px 20px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}
.stacked-row::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

@media (min-width: 640px) {
  .stacked-row {
    justify-content: center;
    padding: 10px 0;
    overflow-x: visible;
  }
}
.stacked-item {
  width: 126px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  transform-origin: bottom center;
  flex-shrink: 0;
  cursor: pointer;
}
/* Stacking overlap (approx 10% of card width) */
.stacked-item:not(:first-child) {
  margin-left: -13px;
}

@media (min-width: 640px) {
  .stacked-item {
    width: 160px;
  }
  .stacked-item:not(:first-child) {
    margin-left: -16px;
  }
}
@media (min-width: 768px) {
  .stacked-item {
    width: 198px;
  }
  .stacked-item:not(:first-child) {
    margin-left: -20px;
  }
}
@media (min-width: 1024px) {
  .stacked-item {
    width: 234px;
  }
  .stacked-item:not(:first-child) {
    margin-left: -23px;
  }
}

/* Hover effects for the target item */
.stacked-item:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 25px 25px rgb(0 0 0 / 0.4));
}

/* Peer translate right: gracefully push items sitting AFTER (underneath visually) the hovered item rightward */
.stacked-item:hover ~ .stacked-item {
  transform: translateX(18px);
}
@media (min-width: 640px) {
  .stacked-item:hover ~ .stacked-item {
    transform: translateX(22px);
  }
}
@media (min-width: 768px) {
  .stacked-item:hover ~ .stacked-item {
    transform: translateX(28px);
  }
}
@media (min-width: 1024px) {
  .stacked-item:hover ~ .stacked-item {
    transform: translateX(35px);
  }
}
</style>
