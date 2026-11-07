<script setup lang="ts">
import type { DbMovie } from "~/utils/type";
import { ref, computed } from "vue";
import { useMovieDrawer } from "~/composables/useMovieDrawer";

const hoverIndex = ref<number | null>(null);

const props = defineProps<{
  list: DbMovie[];
  isList: boolean;
}>();

const emit = defineEmits<{
  (e: "removeFromList", id: number, type: string, title: string): void;
  (e: "addMovie", item: DbMovie, dbName: string): void;
}>();

const { openDrawer } = useMovieDrawer();

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
  <div class="card-grid w-full overflow-x-hidden">
    <div
      v-for="(row, rowIndex) in chunkedList"
      :key="rowIndex"
      class="stacked-row"
    >
      <div
        v-for="(item, index) in row"
        :key="`${item.type}:${item.id}`"
        class="stacked-item drop-shadow-lg flex flex-col group/card"
        :style="{ zIndex: hoverIndex === item.id ? 100 : 50 - index }"
        @mouseenter="hoverIndex = item.id"
        @mouseleave="hoverIndex = null"
      >
        <div
          class="relative overflow-hidden rounded-lg transition-all duration-300 w-full aspect-[2/3] flex-shrink-0 cursor-pointer"
          @click="openDrawer(item)"
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
              <!-- Shown on hover/focus with a mouse; always visible on touch screens. -->
              <div
                class="card-actions bg-black/60 backdrop-blur-md p-1 rounded-tl-xl rounded-br-sm shadow-lg flex flex-col items-center m-[-4px]"
              >
                <div v-if="props.isList" class="flex flex-col">
                  <button
                    type="button"
                    class="action-btn hover:text-red-500 hover:animate-bounce"
                    :aria-label="`Add ${item.title} to favorites`"
                    :title="`Add ${item.title} to favorites`"
                    @click.stop="emit('addMovie', item, 'favoriteList')"
                  >
                    <span class="i-material-symbols-favorite text-2xl" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    class="action-btn hover:text-green-500 hover:animate-pulse"
                    :aria-label="`Add ${item.title} to watchlist`"
                    :title="`Add ${item.title} to watchlist`"
                    @click.stop="emit('addMovie', item, 'watchList')"
                  >
                    <span class="i-material-symbols-add-rounded text-2xl" aria-hidden="true" />
                  </button>
                </div>
                <button
                  v-else
                  type="button"
                  class="action-btn hover:text-red-500 hover:animate-pulse"
                  :aria-label="`Remove ${item.title} from list`"
                  :title="`Remove ${item.title} from list`"
                  @click.stop="emit('removeFromList', item.id, item.type, item.title)"
                >
                  <span
                    class="i-material-symbols-delete-forever-outline-rounded text-2xl"
                    aria-hidden="true"
                  />
                </button>
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
/*
 * Phones (< 640px): a plain 2-column grid (3 from 480px). No overlap and no sideways
 * scrolling, so every poster and its buttons are fully visible.
 * The row wrappers vanish (display: contents) so all cards flow into one grid.
 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 12px;
  padding: 16px 12px 0;
}
.stacked-row {
  display: contents;
}
.stacked-item {
  position: relative;
  min-width: 0;
  cursor: pointer;
}
@media (min-width: 480px) {
  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/*
 * 640px and up: rows of 5 overlapping cards. The card width is derived from the row
 * width so five cards always fit (fixed widths used to clip the first and last card
 * on tablets), capped at --card-max on wide screens.
 */
@media (min-width: 640px) {
  .card-grid {
    --overlap: 14px;
    --shift: 20px;
    --card-max: 234px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 48px 8px 0;
  }
  .stacked-row {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    width: 100%;
    padding: 10px 0;
  }
  .stacked-item {
    width: min(var(--card-max), calc((100% + 4 * var(--overlap)) / 5));
    flex-shrink: 0;
    transform-origin: bottom center;
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  /* Stacking overlap */
  .stacked-item:not(:first-child) {
    margin-left: calc(-1 * var(--overlap));
  }
}
@media (min-width: 1024px) {
  .card-grid {
    --overlap: 23px;
    --shift: 35px;
  }
}

/* Hover effects only for devices that can hover (a tap shouldn't leave a card enlarged). */
@media (min-width: 640px) and (hover: hover) {
  .stacked-item:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 25px 25px rgb(0 0 0 / 0.4));
  }
  /* Push the cards after the hovered one to the right, so it stays fully visible */
  .stacked-item:hover ~ .stacked-item {
    transform: translateX(var(--shift));
  }
}

/* Action buttons: 44px touch targets; with a mouse they appear on hover or keyboard focus. */
.action-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: rgb(209 213 219); /* gray-300 */
  cursor: pointer;
  transition: color 0.2s;
}
@media (hover: hover) and (pointer: fine) {
  .action-btn {
    width: 36px;
    height: 36px;
  }
  .card-actions {
    opacity: 0;
    transform: translateY(6px);
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
  .stacked-item:hover .card-actions,
  .stacked-item:focus-within .card-actions {
    opacity: 1;
    transform: none;
  }
}
</style>
