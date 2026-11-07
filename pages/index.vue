<script setup lang="ts">
import type { PageState } from "primevue/paginator";
import type { DbMovie, RawMovieWithTotal } from "~/utils/type";
// definePageMeta({ layout: "default" });

const isShowSearchResult = ref(false);
const searchQuery = ref("");
let searchQueryLabel = "";

// TMDB only serves the first 500 pages (20 results each), whatever total it reports.
const MAX_BROWSABLE_RESULTS = 500 * 20;

const popularCurrentPage = ref(1);
const popularFirst = ref(0);
const isSearchPending = ref(false);

const filters = ref<HomeFilters>({ ...DEFAULT_HOME_FILTERS });
const filtersActive = computed(() => isHomeFilterActive(filters.value));

const { data, error, pending } = await useAsyncData(
  "fetchPopularMovies",
  async () => {
    const current = filters.value;
    try {
      // Default view keeps the plain popular list; any filter switches to /discover,
      // which filters before paginating so page counts stay correct.
      const raw = isHomeFilterActive(current)
        ? await $fetch<RawMovieWithTotal>("/api/tmdb/discover", {
            params: {
              type: current.type,
              genre: current.genre || undefined,
              minRating: current.minRating || undefined,
              year: current.year || undefined,
              page: popularCurrentPage.value,
            },
          })
        : await $fetch<RawMovieWithTotal>("/api/tmdb/popular", {
            params: { page: popularCurrentPage.value },
          });
      // Keep the media type with the data: /discover results carry no media_type.
      return { raw, mediaType: current.type };
    } catch (err) {
      console.error("Error fetching popular movies:", err);
      throw err;
    }
  },
  {
    watch: [() => popularCurrentPage.value, filters],
  },
);

const homeTitle = computed(() => {
  if (!filtersActive.value) return "Trending Movies";
  return filters.value.type === "tv" ? "Popular TV Series" : "Popular Movies";
});

// Changing filters always restarts from page 1. Updating the page and the filters
// in the same tick means useAsyncData refetches once, not twice.
const handleFiltersChange = (next: HomeFilters) => {
  filters.value = next;
  popularCurrentPage.value = 1;
  popularFirst.value = 0;
};

// Log errors if any
if (error.value) {
  console.error("Failed to fetch popular movies:", error.value);
}

const popularMovies = computed(() => {
  if (data.value) {
    return convertToDbType(data.value.raw, data.value.mediaType);
  } else return { movies: [], totalResults: 0 };
});

// search function area

const searchResults = ref<DbMovie[]>([]);
const searchTotal = ref(0);
const searchCurrentPage = ref(1);
const searchFirst = ref(0);
let currentSearchId = 0;

const fetchSearchResults = async (page: number) => {
  const searchId = ++currentSearchId;
  isSearchPending.value = true;
  try {
    const searchData = await $fetch<RawMovieWithTotal>("/api/tmdb/search", {
      params: { query: searchQuery.value, page },
    });

    // Discard result if a newer search started or the search was cleared
    if (searchId !== currentSearchId) return;

    isShowSearchResult.value = true;
    searchQueryLabel = searchQuery.value; // for search query label
    // searchQuery.value = ""; if clear, pagination will not work

    searchResults.value = convertToDbType(searchData).movies.filter(
      (item) => item.type !== "person",
    );
    searchTotal.value = searchData.total_results; // for pagination
  } finally {
    if (searchId === currentSearchId) {
      isSearchPending.value = false;
    }
  }
};

// };

// Leave search results and go back to the browse list (with its filters and page
// as they were). The popular/discover data is still loaded, so nothing refetches.
const exitSearch = () => {
  currentSearchId++; // invalidate any in-flight search response
  isShowSearchResult.value = false;
  isSearchPending.value = false;
  searchResults.value = [];
  searchCurrentPage.value = 1;
  searchFirst.value = 0;
};

// Clearing the search box is the way back from search results.
watch(searchQuery, (value) => {
  if (!value.trim() && isShowSearchResult.value) exitSearch();
});

const handleEnter = async (event: KeyboardEvent) => {
  if (event.key !== "Enter") return;
  if (!searchQuery.value.trim()) return; // the API rejects empty queries
  searchCurrentPage.value = 1;
  searchFirst.value = 0;
  await fetchSearchResults(1);
};

const handlePopularPageChange = async (event: PageState) => {
  popularCurrentPage.value = event.page + 1;
};

const handleSearchPageChange = async (event: PageState) => {
  searchCurrentPage.value = event.page + 1;
  await fetchSearchResults(searchCurrentPage.value);
};
</script>

<template>
  <div class="py-2 mx-4">
    <Toast class="font-sans" />
    <div
      class="flex flex-col md:flex-row gap-4 my-2 md:items-center justify-between"
    >
      <!-- Header Area (Now on Left) -->
      <div v-if="!isShowSearchResult && popularMovies.movies.length > 0">
        <div
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 text-center max-md:text-xl flex items-center justify-center gap-3 drop-shadow-sm transition-all hover:scale-105"
        >
          <div
            class="i-material-symbols-local-fire-department-rounded text-transparent bg-gradient-to-r from-orange-400 to-red-500"
          />
          {{ homeTitle }}
        </div>
      </div>
      <div v-if="isShowSearchResult && searchResults.length > 0">
        <div
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 text-center max-md:text-xl flex items-center justify-center gap-3 drop-shadow-sm"
        >
          <div class="i-material-symbols-search-rounded text-blue-400" />
          Search Results for "{{ searchQueryLabel }}"
        </div>
      </div>

      <!-- Action Buttons (Now on Right) -->
      <div class="flex gap-4">
        <InputText
          v-model="searchQuery"
          type="search"
          variant="filled"
          placeholder="Search for a movie"
          aria-label="Search movies and TV series"
          size="small"
          @keydown="handleEnter"
        />
      </div>
    </div>

    <HomeFilters
      v-if="!isShowSearchResult"
      :model-value="filters"
      :disabled="pending"
      @update:model-value="handleFiltersChange"
    />

    <!-- Error message -->
    <div
      v-if="error"
      class="mx-4 my-4 p-4 bg-red-500/20 border border-red-500 rounded"
    >
      <p class="text-red-400">
        Error loading movies: {{ error.message || error }}
      </p>
      <p class="text-sm text-gray-400 mt-2">
        Please check your TMDB_API_KEY in .env file
      </p>
    </div>

    <!-- Loading state / Skeletons for popular trending movies -->
    <div
      v-if="pending && !isShowSearchResult"
      class="w-full max-w-[1920px] mx-auto mt-4 mb-0"
    >
      <ItemSkeletonLarge :count="20" />
    </div>

    <!-- Movies list -->
    <div v-else-if="popularMovies.movies.length > 0 && !isShowSearchResult">
      <ItemSmart :list="popularMovies.movies" :is-large="true" />
      <Paginator
        v-model:first="popularFirst"
        :rows="20"
        :total-records="Math.min(popularMovies.totalResults, MAX_BROWSABLE_RESULTS)"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handlePopularPageChange"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="
        !pending && popularMovies.movies.length === 0 && !isShowSearchResult
      "
      class="mx-4 my-4 text-center text-gray-400"
    >
      {{
        filtersActive
          ? "No titles match these filters. Try loosening them."
          : "No movies found. Try refreshing the page."
      }}
    </div>

    <!-- Loading state / Skeletons for search results -->
    <div
      v-if="isSearchPending && isShowSearchResult"
      class="w-full max-w-[1920px] mx-auto mt-4 mb-0"
    >
      <ItemSkeletonLarge :count="20" />
    </div>

    <!-- Search Results List -->
    <div
      v-else-if="
        !isSearchPending && searchResults.length > 0 && isShowSearchResult
      "
    >
      <ItemSmart :list="searchResults" :is-large="true" />
      <Paginator
        v-model:first="searchFirst"
        :rows="20"
        :total-records="searchTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handleSearchPageChange"
      />
    </div>
  </div>
</template>
