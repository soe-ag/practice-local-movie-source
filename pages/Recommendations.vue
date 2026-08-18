<script setup lang="ts">
import type { DbMovie, RawMovie, RecommendationSeed } from "~/utils/type";
import { api } from "~/convex/_generated/api";
import { GENRES } from "~/utils/genres";
import { parseAiRecommendationRoute } from "~/utils/aiRecommendationNavigation";

const config = useRuntimeConfig();
const toast = useToast();
const route = useRoute();

const toDisplayPosterUrl = (posterValue: string): string => {
  if (!posterValue) return "/images/default-movie-poster.jpg";
  if (/^https?:\/\//.test(posterValue) || posterValue.startsWith("/images/")) return posterValue;
  const path = posterValue.startsWith("/") ? posterValue : `/${posterValue}`;
  return `https://image.tmdb.org/t/p/w300${path}`;
};

const savedMovieToDbMovie = (movie: { id: number; title: string; posterUrl: string; rating: number; release: number | null; type: string; genres?: string[]; overview?: string; addedAt: number | string; }): DbMovie => ({
  id: movie.id, title: movie.title, posterUrl: toDisplayPosterUrl(movie.posterUrl), rating: movie.rating,
  release: movie.release, type: movie.type, genres: movie.genres ?? [], overview: movie.overview,
  addedAt: new Date(movie.addedAt),
});

const { data: favoriteListData } = useConvexQuery(api.favoriteList.get);
const { data: watchListData } = useConvexQuery(api.watchList.get);
const favorites = computed<DbMovie[]>(() => (favoriteListData.value ?? []).map(savedMovieToDbMovie));
const watchList = computed<DbMovie[]>(() => (watchListData.value ?? []).map(savedMovieToDbMovie));

const {
  activeTab, useAiRecommendations, selectedFavoriteKeys, selectedManualSeeds, searchQuery,
  searchResults, isSearchPending, filterType, filterRating, filterGenre, currentSeeds,
  currentState, paginatedRecommendations, unfilteredRecommendations, resultFirst, resetFilters,
  toggleFavoriteSeed, addManualSeed, removeManualSeed, generateRecommendations, handleResultPageChange,
} = useRecommendations({ favorites, watchList });

let routeSeedRequestId = 0;
const loadRouteSeed = async () => {
  const currentRequestId = ++routeSeedRequestId;
  const seed = parseAiRecommendationRoute(route.query);
  if (!seed) return;
  activeTab.value = "findSimilar";
  try {
    const item = await $fetch<RawMovie>(`https://api.themoviedb.org/3/${seed.type}/${seed.id}`, { params: { api_key: config.public.tmdbApiKey, language: "en-US" } });
    if (currentRequestId !== routeSeedRequestId) return;
    selectedManualSeeds.value = convertToDbType({ total_results: 1, results: [{ ...item, media_type: seed.type }] }, seed.type).movies as RecommendationSeed[];
  } catch {
    if (currentRequestId !== routeSeedRequestId) return;
    toast.add({ severity: "error", summary: "Title unavailable", detail: "Could not load the title for recommendations.", life: 4000 });
  }
};

watch(() => [route.query.tab, route.query.id, route.query.type], loadRouteSeed, { immediate: true });
</script>

<template>
  <div class="py-4">
    <Toast class="font-sans" />
    <header class="mx-4 mb-5">
      <h1 class="text-2xl sm:text-3xl font-bold text-wrap-balance">Recommendations</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Discover your next favorite movie or TV series from titles you already love.</p>
    </header>

    <div class="flex flex-col xl:flex-row gap-4 mx-4 xl:justify-between items-start xl:items-center text-sm mb-4">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex gap-2" role="tablist" aria-label="Recommendation mode">
          <Button label="For You" icon="i-material-symbols-favorite-rounded" size="small" role="tab" :aria-selected="activeTab === 'forYou'" :severity="activeTab === 'forYou' ? undefined : 'secondary'" :class="activeTab === 'forYou' ? '!bg-gradient-to-r !from-orange-500 !to-red-500 !border-transparent !text-white' : ''" @click="activeTab = 'forYou'" />
          <Button label="Find Similar" icon="i-material-symbols-search-rounded" size="small" role="tab" :aria-selected="activeTab === 'findSimilar'" :severity="activeTab === 'findSimilar' ? undefined : 'secondary'" :class="activeTab === 'findSimilar' ? '!bg-gradient-to-r !from-orange-500 !to-red-500 !border-transparent !text-white' : ''" @click="activeTab = 'findSimilar'" />
        </div>
        <div class="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
          <span class="text-xs font-semibold" :class="useAiRecommendations ? 'text-gray-400' : 'text-gray-900 dark:text-white'">TMDB</span>
          <ToggleSwitch v-model="useAiRecommendations" input-id="recommendation-source-toggle" aria-label="Use AI recommendations" />
          <label for="recommendation-source-toggle" class="text-xs font-semibold cursor-pointer" :class="useAiRecommendations ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'">AI</label>
        </div>
      </div>
      <div v-if="currentState.groups.length" class="flex gap-3 items-center flex-wrap">
        <span id="recommendation-filters-label" class="font-semibold text-gray-400">Filter By:</span>
        <label class="sr-only" for="recommendation-type">Media type</label>
        <select id="recommendation-type" v-model="filterType" aria-labelledby="recommendation-filters-label" class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm border border-gray-300 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"><option value="">All Types</option><option value="movie">Movies</option><option value="tv">TV Series</option></select>
        <label class="sr-only" for="recommendation-rating">Rating</label>
        <select id="recommendation-rating" v-model="filterRating" aria-labelledby="recommendation-filters-label" class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm border border-gray-300 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"><option value="">All Ratings</option><option value="lt7">Less than 7</option><option value="7-7.5">7 ~ 7.5</option><option value="7.5-8">7.5 ~ 8</option><option value="gt8">Above 8</option></select>
        <label class="sr-only" for="recommendation-genre">Genre</label>
        <select id="recommendation-genre" v-model="filterGenre" aria-labelledby="recommendation-filters-label" class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm border border-gray-300 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"><option value="">All Genres</option><option v-for="genre in GENRES" :key="genre.id" :value="genre.name">{{ genre.name }}</option></select>
        <Button label="Reset" icon="i-material-symbols-restart-alt-rounded" size="small" severity="secondary" class="!py-1 !px-3 !text-xs" @click="resetFilters" />
      </div>
    </div>

    <section class="mx-4 mb-5" aria-labelledby="seed-heading">
      <h2 id="seed-heading" class="font-semibold mb-1">{{ activeTab === 'forYou' ? 'Choose a favorite' : 'Choose a title you like' }}</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">{{ activeTab === 'forYou' ? 'Select one favorite to shape these recommendations.' : 'Search and select one movie or TV series.' }}</p>
      <template v-if="activeTab === 'forYou'">
        <div v-if="favoriteListData === undefined" class="flex gap-3 overflow-hidden py-2"><Skeleton v-for="index in 5" :key="index" width="6rem" height="9rem" /></div>
        <div v-else-if="favorites.length" class="recommendation-seed-grid">
          <button v-for="movie in favorites" :key="`${movie.type}:${movie.id}`" type="button" class="relative w-24 text-left cursor-pointer rounded-lg border-2 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500" :class="selectedFavoriteKeys.includes(`${movie.type}:${movie.id}`) ? 'border-orange-500' : 'border-transparent'" :aria-pressed="selectedFavoriteKeys.includes(`${movie.type}:${movie.id}`)" @click="toggleFavoriteSeed(movie)">
            <NuxtImg :src="movie.posterUrl" :alt="movie.title" width="96" height="144" loading="lazy" class="w-full aspect-[2/3] object-cover rounded-md" />
            <span v-if="selectedFavoriteKeys.includes(`${movie.type}:${movie.id}`)" class="absolute top-1 right-1 h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center" aria-hidden="true"><span class="i-material-symbols-check-rounded" /></span>
            <span class="block text-[11px] mt-1 px-1 truncate">{{ movie.title }}</span>
          </button>
        </div>
        <div v-else class="text-sm text-gray-500 dark:text-gray-400 py-4">Add titles to Favorites first, then return here to choose one.</div>
      </template>
      <template v-else>
        <div class="relative max-w-md">
          <label for="recommendation-search" class="sr-only">Search movies or TV series</label>
          <InputText id="recommendation-search" v-model="searchQuery" name="recommendation-search" autocomplete="off" class="w-full" placeholder="Search movies or TV series…" size="small" />
          <div v-if="isSearchPending" class="absolute right-3 top-2.5 i-material-symbols-progress-activity animate-spin" aria-label="Searching…" />
          <div v-if="searchResults.length" class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg overflow-hidden" role="listbox" aria-label="Search results">
            <button v-for="movie in searchResults" :key="`${movie.type}:${movie.id}`" type="button" role="option" class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 cursor-pointer" @click="addManualSeed(movie)"><NuxtImg :src="movie.posterUrl" :alt="movie.title" width="32" height="48" loading="lazy" class="w-8 h-12 object-cover rounded" /><span class="min-w-0"><span class="block text-sm truncate">{{ movie.title }}</span><span class="block text-xs text-gray-500">{{ movie.type === 'tv' ? 'TV Series' : 'Movie' }} · {{ movie.release ?? 'Year N/A' }}</span></span></button>
          </div>
        </div>
        <div v-if="selectedManualSeeds.length" class="flex flex-wrap gap-2 mt-3"><button v-for="seed in selectedManualSeeds" :key="`${seed.type}:${seed.id}`" type="button" class="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer" :aria-label="`Remove ${seed.title}`" @click="removeManualSeed(seed)">{{ seed.title }} <span class="i-material-symbols-close-rounded" aria-hidden="true" /></button></div>
      </template>
      <div class="flex items-center gap-3 mt-4"><Button label="Get Recommendations" icon="i-material-symbols-recommend-rounded" size="small" :loading="currentState.generating" :disabled="!currentSeeds.length || currentState.generating" class="!bg-gradient-to-r !from-orange-500 !to-red-500 hover:!from-orange-600 hover:!to-red-600 !border-transparent !text-white" @click="generateRecommendations" /><span class="text-xs text-gray-500">{{ currentSeeds.length }} selected</span></div>
    </section>

    <div v-if="currentState.response?.notice" role="status" aria-live="polite" class="mx-4 mb-4 p-3 text-sm rounded border border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300">{{ currentState.response.notice }}</div>
    <div v-if="currentState.error" role="alert" class="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500 rounded"><p class="text-red-400">{{ currentState.error }}</p><p class="text-sm text-gray-400 mt-2">Check the connection and try generating again.</p></div>
    <div v-if="currentState.stale" role="status" aria-live="polite" class="mx-4 mb-4 p-3 text-sm rounded border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300">Your selection changed. Generate again to refresh these results.</div>
    <div v-if="currentState.generating" class="flex flex-wrap justify-start items-start px-2 my-4 md:px-8 max-w-[1400px] mx-auto"><ItemSkeleton :count="10" /></div>
    <div v-else-if="currentState.groups.length"><ItemSmart :list="paginatedRecommendations.items" /><Paginator v-if="paginatedRecommendations.totalResults > 20" v-model:first="resultFirst" :rows="20" :total-records="paginatedRecommendations.totalResults" :pt="{ root: { class: '!bg-transparent' } }" @page="handleResultPageChange" /><div v-if="!paginatedRecommendations.items.length" class="mx-4 text-sm text-gray-500 dark:text-gray-400">{{ unfilteredRecommendations.length ? 'No recommendations match the selected filters.' : 'No new recommendations were found for this selection.' }}</div></div>
  </div>
</template>

<style scoped>
.recommendation-seed-grid { display: grid; grid-template-columns: repeat(auto-fill, 6rem); grid-auto-rows: 10.25rem; gap: 0.75rem; width: 100%; max-height: 21.5rem; overflow-x: hidden; overflow-y: auto; padding-bottom: 0.25rem; scrollbar-width: thin; }
</style>
