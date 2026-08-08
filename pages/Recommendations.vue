<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type {
  DbMovie,
  RawMovieWithTotal,
  RecommendationCandidate,
  RecommendationGroup,
  RecommendationSeed,
} from "~/utils/type";
import { api } from "~/convex/_generated/api";
import { GENRES } from "~/utils/genres";
import { buildRecommendations, mediaKey } from "~/utils/recommendations";
import { createRecommendationLoader } from "~/utils/recommendationLoader";

type RecommendationTab = "forYou" | "findSimilar";

const config = useRuntimeConfig();
const toast = useToast();

const activeTab = ref<RecommendationTab>("forYou");
const selectedFavoriteKeys = ref<string[]>([]);
const selectedManualSeeds = ref<RecommendationSeed[]>([]);
const searchQuery = ref("");
const searchResults = ref<DbMovie[]>([]);
const isSearchPending = ref(false);
const filterType = ref("");
const filterRating = ref("");
const filterGenre = ref("");
let searchRequestId = 0;

const groupsByTab = reactive<Record<RecommendationTab, RecommendationGroup[]>>({
  forYou: [],
  findSimilar: [],
});
const staleByTab = reactive<Record<RecommendationTab, boolean>>({
  forYou: false,
  findSimilar: false,
});
const errorByTab = reactive<Record<RecommendationTab, string | null>>({
  forYou: null,
  findSimilar: null,
});
const generatingByTab = reactive<Record<RecommendationTab, boolean>>({
  forYou: false,
  findSimilar: false,
});
const requestIdByTab = reactive<Record<RecommendationTab, number>>({
  forYou: 0,
  findSimilar: 0,
});

const { data: favoriteListData } = useConvexQuery(api.favoriteList.get);
const { data: watchListData } = useConvexQuery(api.watchList.get);

const toDisplayPosterUrl = (posterValue: string): string => {
  if (!posterValue) return "/images/default-movie-poster.jpg";
  if (/^https?:\/\//.test(posterValue) || posterValue.startsWith("/images/")) {
    return posterValue;
  }
  const path = posterValue.startsWith("/") ? posterValue : `/${posterValue}`;
  return `https://image.tmdb.org/t/p/w300${path}`;
};

const savedMovieToDbMovie = (movie: {
  id: number;
  title: string;
  posterUrl: string;
  rating: number;
  release: number | null;
  type: string;
  genres?: string[];
  overview?: string;
  addedAt: number | string;
}): DbMovie => ({
  id: movie.id,
  title: movie.title,
  posterUrl: toDisplayPosterUrl(movie.posterUrl),
  rating: movie.rating,
  release: movie.release,
  type: movie.type,
  genres: movie.genres ?? [],
  overview: movie.overview,
  addedAt: new Date(movie.addedAt),
});

const favorites = computed<DbMovie[]>(() =>
  (favoriteListData.value ?? []).map(savedMovieToDbMovie),
);

const selectedFavoriteSeeds = computed<RecommendationSeed[]>(() => {
  const selected = new Set(selectedFavoriteKeys.value);
  return favorites.value.filter((movie) => selected.has(mediaKey(movie)));
});

const currentSeeds = computed(() =>
  activeTab.value === "forYou"
    ? selectedFavoriteSeeds.value
    : selectedManualSeeds.value,
);

const currentGroups = computed(() => groupsByTab[activeTab.value]);

const excludedKeys = computed(() => {
  const keys = new Set<string>();
  for (const movie of favoriteListData.value ?? []) keys.add(mediaKey(movie));
  for (const movie of watchListData.value ?? []) keys.add(mediaKey(movie));
  for (const seed of currentSeeds.value) keys.add(mediaKey(seed));
  return keys;
});

const displayedRecommendations = computed<RecommendationCandidate[]>(() =>
  buildRecommendations({
    groups: currentGroups.value,
    excludedKeys: excludedKeys.value,
    filters: {
      type: filterType.value,
      rating: filterRating.value,
      genre: filterGenre.value,
    },
    limit: 20,
  }),
);

const unfilteredRecommendations = computed<RecommendationCandidate[]>(() =>
  buildRecommendations({
    groups: currentGroups.value,
    excludedKeys: excludedKeys.value,
  }),
);

const reasonByKey = computed<Record<string, RecommendationCandidate>>(() =>
  Object.fromEntries(
    displayedRecommendations.value.map((item) => [mediaKey(item), item]),
  ),
);

const getReason = (item: DbMovie): RecommendationCandidate =>
  reasonByKey.value[mediaKey(item)]!;

const markCurrentResultsStale = () => {
  errorByTab[activeTab.value] = null;
  if (groupsByTab[activeTab.value].length) staleByTab[activeTab.value] = true;
};

const showLimitToast = (message: string) => {
  toast.add({
    severity: "warn",
    summary: "Selection limit",
    detail: message,
    life: 3000,
  });
};

const toggleFavoriteSeed = (movie: DbMovie) => {
  const key = mediaKey(movie);
  if (selectedFavoriteKeys.value.includes(key)) {
    selectedFavoriteKeys.value = selectedFavoriteKeys.value.filter(
      (selectedKey) => selectedKey !== key,
    );
    markCurrentResultsStale();
    return;
  }
  if (selectedFavoriteKeys.value.length >= 5) {
    showLimitToast("Choose up to five favorites.");
    return;
  }
  selectedFavoriteKeys.value = [...selectedFavoriteKeys.value, key];
  markCurrentResultsStale();
};

const addManualSeed = (movie: DbMovie) => {
  const key = mediaKey(movie);
  if (selectedManualSeeds.value.some((seed) => mediaKey(seed) === key)) return;
  if (selectedManualSeeds.value.length >= 3) {
    showLimitToast("Choose up to three titles.");
    return;
  }
  selectedManualSeeds.value = [...selectedManualSeeds.value, movie];
  searchQuery.value = "";
  searchResults.value = [];
  markCurrentResultsStale();
};

const removeManualSeed = (seed: RecommendationSeed) => {
  const key = mediaKey(seed);
  selectedManualSeeds.value = selectedManualSeeds.value.filter(
    (item) => mediaKey(item) !== key,
  );
  markCurrentResultsStale();
};

const searchTitles = useDebounceFn(
  async (query: string, currentSearchId: number) => {
    try {
      const response = await $fetch<RawMovieWithTotal>(
        "https://api.themoviedb.org/3/search/multi",
        {
          params: {
            api_key: config.public.tmdbApiKey,
            include_adult: false,
            language: "en-US",
            page: 1,
            query,
          },
        },
      );
      if (currentSearchId !== searchRequestId) return;
      searchResults.value = convertToDbType(response).movies
        .filter((item) => item.type === "movie" || item.type === "tv")
        .slice(0, 8);
    } catch {
      if (currentSearchId === searchRequestId) {
        searchResults.value = [];
        toast.add({
          severity: "error",
          summary: "Search failed",
          detail: "Could not search TMDB. Try again.",
          life: 3000,
        });
      }
    } finally {
      if (currentSearchId === searchRequestId) isSearchPending.value = false;
    }
  },
  350,
);

watch(searchQuery, (value) => {
  const currentSearchId = ++searchRequestId;
  const query = value.trim();
  if (query.length < 2) {
    searchResults.value = [];
    isSearchPending.value = false;
    return;
  }
  isSearchPending.value = true;
  searchTitles(query, currentSearchId);
});

const seedSignature = (seeds: RecommendationSeed[]) =>
  seeds.map(mediaKey).sort().join("|");

const fetchSeedRecommendations = async (
  seed: RecommendationSeed,
): Promise<DbMovie[]> => {
  const type = seed.type === "tv" ? "tv" : "movie";
  const response = await $fetch<RawMovieWithTotal>(
    `https://api.themoviedb.org/3/${type}/${seed.id}/recommendations`,
    {
      params: {
        api_key: config.public.tmdbApiKey,
        language: "en-US",
        page: 1,
      },
    },
  );
  return convertToDbType(response, type).movies;
};

const recommendationLoader = createRecommendationLoader(
  fetchSeedRecommendations,
);

const generateRecommendations = async () => {
  const tab = activeTab.value;
  const seeds = [...currentSeeds.value];
  if (!seeds.length) return;

  const signature = seedSignature(seeds);
  const currentRequestId = ++requestIdByTab[tab];
  generatingByTab[tab] = true;
  errorByTab[tab] = null;

  const { groups, failedSeeds } = await recommendationLoader.load(seeds);

  if (
    currentRequestId !== requestIdByTab[tab] ||
    signature !== seedSignature(
      tab === "forYou" ? selectedFavoriteSeeds.value : selectedManualSeeds.value,
    )
  ) {
    generatingByTab[tab] = false;
    return;
  }

  if (!groups.length) {
    groupsByTab[tab] = [];
    staleByTab[tab] = false;
    errorByTab[tab] =
      "TMDB could not load recommendations for the selected titles.";
    toast.add({
      severity: "error",
      summary: "Recommendations failed",
      detail: "TMDB could not load recommendations for the selected titles.",
      life: 4000,
    });
  } else {
    groupsByTab[tab] = groups;
    staleByTab[tab] = false;
    errorByTab[tab] = null;
    if (failedSeeds.length) {
      toast.add({
        severity: "warn",
        summary: "Some titles failed",
        detail: `Could not load: ${failedSeeds.join(", ")}`,
        life: 4000,
      });
    }
  }
  generatingByTab[tab] = false;
};

const resetFilters = () => {
  filterType.value = "";
  filterRating.value = "";
  filterGenre.value = "";
};

watch(activeTab, () => {
  resetFilters();
  searchResults.value = [];
});
</script>

<template>
  <div class="py-2">
    <Toast class="font-sans" />

    <div
      class="flex flex-col xl:flex-row gap-4 mx-4 xl:justify-between items-start xl:items-center text-sm mb-4"
    >
      <div class="flex gap-2">
        <Button
          label="For You"
          icon="i-material-symbols-favorite-rounded"
          size="small"
          :severity="activeTab === 'forYou' ? undefined : 'secondary'"
          :class="
            activeTab === 'forYou'
              ? '!bg-gradient-to-r !from-orange-500 !to-red-500 !border-transparent !text-white'
              : ''
          "
          @click="activeTab = 'forYou'"
        />
        <Button
          label="Find Similar"
          icon="i-material-symbols-search-rounded"
          size="small"
          :severity="activeTab === 'findSimilar' ? undefined : 'secondary'"
          :class="
            activeTab === 'findSimilar'
              ? '!bg-gradient-to-r !from-orange-500 !to-red-500 !border-transparent !text-white'
              : ''
          "
          @click="activeTab = 'findSimilar'"
        />
      </div>

      <div v-if="currentGroups.length" class="flex gap-3 items-center flex-wrap">
        <div class="font-semibold text-gray-400">Filter By:</div>
        <select
          v-model="filterType"
          class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Series</option>
        </select>
        <select
          v-model="filterRating"
          class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Ratings</option>
          <option value="lt7">Less than 7</option>
          <option value="7-7.5">7 ~ 7.5</option>
          <option value="7.5-8">7.5 ~ 8</option>
          <option value="gt8">Above 8</option>
        </select>
        <select
          v-model="filterGenre"
          class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Genres</option>
          <option v-for="genre in GENRES" :key="genre.id" :value="genre.name">
            {{ genre.name }}
          </option>
        </select>
        <Button
          label="Reset"
          icon="i-material-symbols-restart-alt-rounded"
          size="small"
          severity="secondary"
          class="!py-1 !px-3 !text-xs"
          @click="resetFilters"
        />
      </div>
    </div>

    <section class="mx-4 mb-5">
      <template v-if="activeTab === 'forYou'">
        <div class="font-semibold mb-1">Choose favorites</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Select up to five titles to shape these recommendations.
        </div>

        <div
          v-if="favoriteListData === undefined"
          class="flex gap-3 overflow-hidden py-2"
        >
          <Skeleton v-for="index in 5" :key="index" width="6rem" height="9rem" />
        </div>
        <div
          v-else-if="favorites.length"
          class="flex gap-3 overflow-x-auto pb-3 recommendation-seed-row"
        >
          <button
            v-for="movie in favorites"
            :key="mediaKey(movie)"
            type="button"
            class="relative w-24 flex-shrink-0 text-left cursor-pointer rounded-lg border-2 transition-colors"
            :class="
              selectedFavoriteKeys.includes(mediaKey(movie))
                ? 'border-orange-500'
                : 'border-transparent'
            "
            :aria-pressed="selectedFavoriteKeys.includes(mediaKey(movie))"
            @click="toggleFavoriteSeed(movie)"
          >
            <NuxtImg
              :src="movie.posterUrl"
              :alt="movie.title"
              class="w-full aspect-[2/3] object-cover rounded-md"
            />
            <span
              v-if="selectedFavoriteKeys.includes(mediaKey(movie))"
              class="absolute top-1 right-1 h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center"
            >
              <span class="i-material-symbols-check-rounded" />
            </span>
            <span class="block text-[11px] mt-1 px-1 truncate">{{ movie.title }}</span>
          </button>
        </div>
        <div v-else class="text-sm text-gray-500 dark:text-gray-400 py-4">
          Add titles to Favorites first, then return here to choose them.
        </div>
      </template>

      <template v-else>
        <div class="font-semibold mb-1">Choose titles you like</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Search and select up to three movies or TV series.
        </div>
        <div class="relative max-w-md">
          <InputText
            v-model="searchQuery"
            class="w-full"
            placeholder="Search movies or TV series"
            size="small"
          />
          <div
            v-if="isSearchPending"
            class="absolute right-3 top-2.5 i-material-symbols-progress-activity animate-spin"
          />
          <div
            v-if="searchResults.length"
            class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg overflow-hidden"
          >
            <button
              v-for="movie in searchResults"
              :key="mediaKey(movie)"
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              @click="addManualSeed(movie)"
            >
              <NuxtImg
                :src="movie.posterUrl"
                :alt="movie.title"
                class="w-8 h-12 object-cover rounded"
              />
              <span class="min-w-0">
                <span class="block text-sm truncate">{{ movie.title }}</span>
                <span class="block text-xs text-gray-500">
                  {{ movie.type === "tv" ? "TV Series" : "Movie" }} ·
                  {{ movie.release ?? "Year N/A" }}
                </span>
              </span>
            </button>
          </div>
        </div>
        <div v-if="selectedManualSeeds.length" class="flex flex-wrap gap-2 mt-3">
          <button
            v-for="seed in selectedManualSeeds"
            :key="mediaKey(seed)"
            type="button"
            class="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
            :aria-label="`Remove ${seed.title}`"
            @click="removeManualSeed(seed)"
          >
            {{ seed.title }}
            <span class="i-material-symbols-close-rounded" />
          </button>
        </div>
      </template>

      <div class="flex items-center gap-3 mt-4">
        <Button
          label="Get Recommendations"
          icon="i-material-symbols-recommend-rounded"
          size="small"
          :loading="generatingByTab[activeTab]"
          :disabled="!currentSeeds.length || generatingByTab[activeTab]"
          class="!bg-gradient-to-r !from-orange-500 !to-red-500 hover:!from-orange-600 hover:!to-red-600 !border-transparent !text-white"
          @click="generateRecommendations"
        />
        <span class="text-xs text-gray-500">
          {{ currentSeeds.length }} selected
        </span>
      </div>
    </section>

    <div
      v-if="errorByTab[activeTab]"
      class="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500 rounded"
    >
      <p class="text-red-400">{{ errorByTab[activeTab] }}</p>
      <p class="text-sm text-gray-400 mt-2">
        Check the connection and try generating again.
      </p>
    </div>

    <div
      v-if="staleByTab[activeTab]"
      class="mx-4 mb-4 p-3 text-sm rounded border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    >
      Your selection changed. Generate again to refresh these results.
    </div>

    <div
      v-if="generatingByTab[activeTab]"
      class="flex flex-wrap justify-start items-start px-2 my-4 md:px-8 max-w-[1400px] mx-auto"
    >
      <ItemSkeleton :count="10" />
    </div>

    <div v-else-if="currentGroups.length">
      <ItemSmart :list="displayedRecommendations">
        <template #meta="{ item }">
          <RecommendationReason
            :candidate="getReason(item)"
          />
        </template>
      </ItemSmart>
      <div
        v-if="!displayedRecommendations.length"
        class="mx-4 text-sm text-gray-500 dark:text-gray-400"
      >
        {{
          unfilteredRecommendations.length
            ? "No recommendations match the selected filters."
            : "TMDB returned no new recommendations for these selections."
        }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.recommendation-seed-row {
  scrollbar-width: thin;
}
</style>
