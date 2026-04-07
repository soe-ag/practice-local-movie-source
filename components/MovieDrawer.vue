<script setup lang="ts">
import { useMovieDrawer } from "~/composables/useMovieDrawer";

const { isDrawerOpen, selectedMovie, closeDrawer } = useMovieDrawer();

const movieTypeLabel = computed(() => {
  if (!selectedMovie.value?.type) return "Movie";
  const type = selectedMovie.value.type;
  if (type === "tv") return "TV Series";
  if (type === "movie") return "Movie";
  return type.charAt(0).toUpperCase() + type.slice(1);
});

const ratingText = computed(() => {
  if (!selectedMovie.value) return "-";
  return selectedMovie.value.rating
    ? selectedMovie.value.rating.toFixed(1)
    : "-";
});
</script>

<template>
  <Drawer
    v-model:visible="isDrawerOpen"
    position="right"
    :dismissable="true"
    :show-close-icon="false"
    class="!w-screen sm:!w-[29rem] !max-w-full font-sans"
    :pt="{
      root: {
        class:
          'bg-white/95 dark:bg-#111618 backdrop-blur-xl border-l border-white/10',
      },
      header: { class: 'hidden' },
      content: { class: '!p-0' },
      mask: { class: 'bg-black/55 backdrop-blur-[2px]' },
    }"
  >
    <div v-if="selectedMovie" class="h-full flex flex-col font-sans">
      <div class="relative overflow-hidden bg-black">
        <img
          :src="selectedMovie.posterUrl"
          :alt="selectedMovie.title"
          class="w-auto h-auto max-w-full max-h-[75vh] sm:max-h-[70vh] object-contain mx-auto block"
        />

        <button
          type="button"
          class="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/25 hover:bg-black/80 transition-colors"
          aria-label="Close movie details"
          @click="closeDrawer"
        >
          <span class="i-material-symbols-close-rounded text-2xl" />
        </button>
      </div>

      <div class="px-5 py-5 sm:px-6 sm:py-6 overflow-y-auto">
        <div
          class="text-2xl font-bold leading-tight text-gray-900 dark:text-white"
        >
          {{ selectedMovie.title }}
        </div>
        <div class="mt-3 mb-5 flex flex-wrap items-center gap-2">
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/10 dark:text-gray-100 dark:border-white/20"
          >
            {{ movieTypeLabel }}
          </span>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/10 dark:text-gray-100 dark:border-white/20"
          >
            {{ selectedMovie.release ?? "Year N/A" }}
          </span>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/40 dark:bg-amber-500/25 dark:text-amber-200"
          >
            Rating {{ ratingText }}
          </span>
        </div>

        <div
          v-if="selectedMovie.genres && selectedMovie.genres.length"
          class="mb-5 flex flex-wrap items-center gap-2"
        >
          <span
            v-for="genre in selectedMovie.genres"
            :key="genre"
            class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/12 text-blue-700 border border-blue-500/35 dark:bg-blue-500/20 dark:text-blue-200"
          >
            {{ genre }}
          </span>
        </div>

        <div
          class="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 mb-2"
        >
          Overview
        </div>
        <p
          class="text-[15px] leading-7 text-gray-700 dark:text-gray-200 whitespace-pre-line"
        >
          {{
            selectedMovie.overview ||
            "No description available for this title yet."
          }}
        </p>
      </div>
    </div>
  </Drawer>
</template>
