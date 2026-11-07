<script setup lang="ts">
import type { DbMovie, RawMovie, RecommendationSeed } from "~/utils/type";
import { api } from "~/convex/_generated/api";
import { parseAiRecommendationRoute } from "~/utils/aiRecommendationNavigation";

const toast = useToast();
const route = useRoute();

const { data: favoriteListData } = useConvexQuery(api.favoriteList.get);
const { data: watchListData } = useConvexQuery(api.watchList.get);
const favorites = computed<DbMovie[]>(() => (favoriteListData.value ?? []).map(savedMovieToDbMovie));
const watchList = computed<DbMovie[]>(() => (watchListData.value ?? []).map(savedMovieToDbMovie));

const {
  activeTab, recommendationSource, selectedFavoriteKeys, selectedManualSeeds, searchQuery,
  searchResults, isSearchPending, currentSeeds,
  currentState, paginatedRecommendations, resultFirst,
  toggleFavoriteSeed, addManualSeed, removeManualSeed, generateRecommendations, handleResultPageChange,
} = useRecommendations({ favorites, watchList });

const seed = computed(() => currentSeeds.value[0] ?? null);

const clearSeed = () => {
  const current = seed.value;
  if (!current) return;
  if (activeTab.value === "forYou") toggleFavoriteSeed(current as DbMovie);
  else removeManualSeed(current);
};

const resultsHeading = computed(() => {
  const title = currentSeeds.value[0]?.title ?? currentState.value.groups[0]?.seed.title;
  return title ? `Because you liked ${title}` : "Your recommendations";
});
const sourceLabel = computed(() =>
  currentState.value.response?.source === "ai" ? "AI picks" : "Similar titles",
);

let routeSeedRequestId = 0;
const loadRouteSeed = async () => {
  const currentRequestId = ++routeSeedRequestId;
  const routeSeed = parseAiRecommendationRoute(route.query);
  if (!routeSeed) return;
  activeTab.value = "findSimilar";
  try {
    const item = await $fetch<RawMovie>("/api/tmdb/title", { params: { type: routeSeed.type, id: routeSeed.id } });
    if (currentRequestId !== routeSeedRequestId) return;
    selectedManualSeeds.value = convertToDbType({ total_results: 1, results: [{ ...item, media_type: routeSeed.type }] }, routeSeed.type).movies as RecommendationSeed[];
  } catch {
    if (currentRequestId !== routeSeedRequestId) return;
    toast.add({ severity: "error", summary: "Title unavailable", detail: "Could not load the title for recommendations.", life: 4000 });
  }
};

watch(() => [route.query.tab, route.query.id, route.query.type], loadRouteSeed, { immediate: true });
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
    <Toast class="font-sans" />

    <header class="mb-6 max-w-2xl">
      <p class="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
        Recommendations
      </p>
      <h1 class="mt-1 text-3xl font-extrabold text-wrap-balance sm:text-4xl">
        What should you watch next?
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Pick a title you love and we'll find more like it, with a reason for every match.
      </p>
    </header>

    <RecommendationSeedPanel
      v-model:mode="activeTab"
      v-model:source="recommendationSource"
      v-model:search-query="searchQuery"
      :favorites="favorites"
      :favorites-loading="favoriteListData === undefined"
      :selected-favorite-keys="selectedFavoriteKeys"
      :search-results="searchResults"
      :is-search-pending="isSearchPending"
      :seed="seed"
      :generating="currentState.generating"
      @toggle-favorite="toggleFavoriteSeed"
      @pick-search-result="addManualSeed"
      @clear="clearSeed"
      @generate="generateRecommendations"
    />

    <!-- Results -->
    <section class="mt-8" aria-live="polite" :aria-busy="currentState.generating">
      <div
        v-if="currentState.error"
        role="alert"
        class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/60 bg-red-500/10 p-4"
      >
        <div>
          <p class="font-semibold text-red-600 dark:text-red-400">{{ currentState.error }}</p>
          <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
            Check your connection and try again.
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-red-600 disabled:opacity-50"
          :disabled="!seed || currentState.generating"
          @click="generateRecommendations"
        >
          Try again
        </button>
      </div>

      <div
        v-if="currentState.response?.notice"
        role="status"
        class="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"
      >
        <span class="i-material-symbols-info-outline-rounded mt-0.5 shrink-0 text-lg" aria-hidden="true" />
        <span>{{ currentState.response.notice }}</span>
      </div>

      <!-- Loading -->
      <template v-if="currentState.generating">
        <div class="mb-5 h-7 w-72 max-w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" aria-hidden="true" />
        <div class="flex flex-wrap justify-center sm:justify-start items-start px-2 md:px-8 max-w-[1400px] mx-auto">
          <ItemSkeleton :count="20" />
        </div>
      </template>

      <!-- Loaded -->
      <template v-else-if="currentState.groups.length">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div class="min-w-0">
            <h2 class="text-2xl font-extrabold text-wrap-balance">{{ resultsHeading }}</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {{ paginatedRecommendations.totalResults }}
              {{ paginatedRecommendations.totalResults === 1 ? "match" : "matches" }}
              <span class="mx-1 text-gray-400" aria-hidden="true">·</span>
              {{ sourceLabel }}
            </p>
          </div>
          <div
            v-if="currentState.stale"
            role="status"
            class="flex items-center gap-3 rounded-full border border-amber-500/50 bg-amber-500/10 py-1 pl-4 pr-1 text-sm text-amber-800 dark:text-amber-300"
          >
            Your selection changed
            <button
              type="button"
              class="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white cursor-pointer hover:bg-amber-600"
              @click="generateRecommendations"
            >
              Refresh
            </button>
          </div>
        </div>

        <ItemSmart v-if="paginatedRecommendations.items.length" :list="paginatedRecommendations.items" />

        <div
          v-else
          class="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-600 dark:text-gray-300"
        >
          No new recommendations were found for this title.
        </div>

        <Paginator
          v-if="paginatedRecommendations.totalResults > 20"
          v-model:first="resultFirst"
          :rows="20"
          :total-records="paginatedRecommendations.totalResults"
          :pt="{ root: { class: '!bg-transparent' } }"
          class="mt-6"
          @page="handleResultPageChange"
        />
      </template>
    </section>
  </div>
</template>
