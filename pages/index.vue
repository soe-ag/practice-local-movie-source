<script setup lang="ts">
import { useRuntimeConfig } from "#app";
import type { PageState } from "primevue/paginator";
import type { DbMovie, RawMovieWithTotal } from "~/utils/type";
// definePageMeta({ layout: "default" });

const config = useRuntimeConfig();

// Debug: Check if API key is loaded
if (import.meta.client) {
  console.log("TMDB API Key:", config.public.tmdbApiKey ? "Loaded" : "Missing");
}

const isShowSearchResult = ref(false);
const searchQuery = ref("");
let searchQueryLabel = "";

const popularCurrentPage = ref(1);
const popularFirst = ref(0);
const isSearchPending = ref(false);

const { data, error, pending, refresh } = await useAsyncData(
  "fetchPopularMovies",
  async () => {
    if (!config.public.tmdbApiKey) {
      console.error("TMDB API Key is missing!");
      throw new Error("TMDB API Key is not configured");
    }
    try {
      const result = await $fetch<RawMovieWithTotal>(
        `https://api.themoviedb.org/3/movie/popular`,
        {
          params: {
            api_key: config.public.tmdbApiKey,
            language: "en-US",
            page: popularCurrentPage.value,
          },
        },
      );
      return result;
    } catch (err) {
      console.error("Error fetching popular movies:", err);
      throw err;
    }
  },
  {
    watch: [() => popularCurrentPage.value],
  },
);

// Log errors if any
if (error.value) {
  console.error("Failed to fetch popular movies:", error.value);
}

const popularMovies = computed(() => {
  if (data.value) {
    return convertToDbType(data.value);
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
    const searchData = await $fetch<RawMovieWithTotal>(
      "https://api.themoviedb.org/3/search/multi",
      {
        params: {
          api_key: config.public.tmdbApiKey,
          include_adult: false,
          query: searchQuery.value,
          language: "en-US",
          page,
        },
      },
    );

    // Discard result if a newer search or a Trending reset has been triggered
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

const handleTrendingClick = () => {
  currentSearchId++; // invalidate any in-flight search response
  searchQuery.value = "";
  isShowSearchResult.value = false;
  isSearchPending.value = false;
  searchResults.value = [];
  searchCurrentPage.value = 1;
  searchFirst.value = 0;
  popularCurrentPage.value = 1;
  popularFirst.value = 0;
  refresh();
};

const handleEnter = async (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    searchCurrentPage.value = 1;
    searchFirst.value = 0;
    await fetchSearchResults(1);
  }
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
          Trending Movies
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
        <Button
          label="Trending"
          icon="i-material-symbols-kid-star-sharp"
          class="!bg-gradient-to-r !from-orange-500 !to-red-500 hover:!from-orange-600 hover:!to-red-600 !border-transparent !text-white shadow-md transition-all duration-200"
          size="small"
          :pt="{
            root: { class: '!py-1 !px-2' },
            label: { class: 'max-md:text-[10px] !text-xs font-semibold' },
            icon: { class: '!text-xs mr-1' },
          }"
          @click="handleTrendingClick"
        />

        <InputText
          v-model="searchQuery"
          type="text"
          variant="filled"
          placeholder="Search for a movie"
          size="small"
          @keydown="handleEnter"
        />
      </div>
    </div>

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
        :total-records="popularMovies.totalResults"
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
      No movies found. Try refreshing the page.
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
