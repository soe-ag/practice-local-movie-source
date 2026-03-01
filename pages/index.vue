<script setup lang="ts">
import { useRuntimeConfig } from "#app";
import type { PageState } from "primevue/paginator";
import type { DbMovie, RawMovieWithTotal } from "~/utils/type";
// definePageMeta({ layout: "default" });

const config = useRuntimeConfig();

// Debug: Check if API key is loaded
if (process.client) {
  console.log("TMDB API Key:", config.public.tmdbApiKey ? "Loaded" : "Missing");
}

let isShowSearchResult = false;

const searchQuery = ref("");
let searchQueryLabel = "";

const popularCurrentPage = ref(1);
const activeTab = ref<"trending" | "nowPlaying">("trending");

const { data, error, refresh } = await useAsyncData(
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
        }
      );
      return result;
    } catch (err: any) {
      console.error("Error fetching popular movies:", err);
      throw err;
    }
  },
  {
    watch: [() => popularCurrentPage.value, () => isShowSearchResult],
  }
);

// Log errors if any
if (error.value) {
  console.error("Failed to fetch popular movies:", error.value);
}

const popularMovies = computed(() => {
  if (data.value) {
    isShowSearchResult = false;
    return convertToDbType(data.value);
  } else return { movies: [], totalResults: 0 };
});

// now playing area

const nowPlayingMovies = ref<DbMovie[]>([]);
const nowPlayingTotal = ref(0);
const nowPlayingCurrentPage = ref(1);

const fetchNowPlaying = async (page: number) => {
  const rawData = await $fetch<RawMovieWithTotal>(
    "https://api.themoviedb.org/3/movie/now_playing",
    {
      params: {
        api_key: config.public.tmdbApiKey,
        language: "en-US",
        page,
      },
    }
  );
  nowPlayingMovies.value = convertToDbType(rawData).movies;
  nowPlayingTotal.value = rawData.total_results;
};

const handleNowPlayingPageChange = async (event: PageState) => {
  nowPlayingCurrentPage.value = event.page + 1;
  await fetchNowPlaying(nowPlayingCurrentPage.value);
};

// search function area

const searchResults = ref<DbMovie[]>([]);
const searchTotal = ref(0);
const searchCurrentPage = ref(1);

const fetchSearchResults = async (page: number) => {
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
    }
  );

  isShowSearchResult = true;
  searchQueryLabel = searchQuery.value; // for search query label
  // searchQuery.value = ""; if clear, pagination will not work

  searchResults.value = convertToDbType(searchData).movies.filter(
    (item) => item.type !== "person"
  );
  searchTotal.value = searchData.total_results; // for pagination
};

// };

const handleEnter = async (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    await fetchSearchResults(1);
  }
};

const handlePopularPageChange = async (event: PageState) => {
  console.log(event);
  popularCurrentPage.value = event.page + 1;
  // await fetchPopularMovies(popularCurrentPage.value);
};

const handleSearchPageChange = async (event: PageState) => {
  console.log(event);
  searchCurrentPage.value = event.page + 1;
  await fetchSearchResults(searchCurrentPage.value);
};
</script>

<template>
  <div class="py-2 mx-4">
    <Toast class="font-sans" />
    <div class="flex gap-4 my-2">
      <Button
        label="Trending"
        icon="i-material-symbols-kid-star-sharp"
        class=""
        :pt="{ label: { class: 'max-md:text-xs' } }"
        @click="
          () => {
            searchQuery = '';
            activeTab = 'trending';
            refresh();
          }
        "
      />

      <Button
        label="Now Playing"
        icon="i-material-symbols-play-circle-outline"
        class=""
        :pt="{ label: { class: 'max-md:text-xs' } }"
        @click="
          async () => {
            searchQuery = '';
            activeTab = 'nowPlaying';
            isShowSearchResult = false;
            searchResults = [];
            await fetchNowPlaying(1);
          }
        "
      />

      <InputText
        v-model="searchQuery"
        type="text"
        variant="filled"
        placeholder="Search for a movie"
        size="small"
        @keydown="handleEnter"
      />
      <Button
        icon="i-material-symbols-search"
        size="small"
        aria-label="Search for a movie"
        :pt="{ label: { class: 'max-md:text-xs' } }"
        @click="() => fetchSearchResults(1)"
      />
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

    <!-- Loading state -->
    <div v-if="!data && !error" class="mx-4 my-4 text-center text-gray-400">
      Loading movies...
    </div>

    <!-- Movies list -->
    <div v-if="popularMovies.movies.length > 0 && !isShowSearchResult && activeTab === 'trending'">
      <div class="text-2xl text-gray my-2 text-center max-md:text-sm">
        ~ Trending Movies ~
      </div>
      <ItemSmart :list="popularMovies.movies" />
      <Paginator
        :rows="20"
        :total-records="popularMovies.totalResults"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handlePopularPageChange"
      />
    </div>

    <div
      v-if="nowPlayingMovies.length > 0 && !isShowSearchResult && activeTab === 'nowPlaying'"
    >
      <div class="text-2xl text-gray my-2 text-center max-md:text-sm">
        ~ Now Playing ~
      </div>
      <ItemSmart :list="nowPlayingMovies" />
      <Paginator
        :rows="20"
        :total-records="nowPlayingTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handleNowPlayingPageChange"
      />
    <!-- Empty state -->
    <div
      v-if="data && popularMovies.movies.length === 0 && !isShowSearchResult"
      class="mx-4 my-4 text-center text-gray-400"
    >
      No movies found. Try refreshing the page.
    </div>

    <div v-if="searchResults.length > 0 && isShowSearchResult">
      <div class="text-2xl text-gray max-md:text-sm">
        Search Results for "{{ searchQueryLabel }}"
      </div>
      <ItemSmart :list="searchResults" />
      <!-- <div>total result is {{ searchTotal }}, {{ searchCurrentPage }}</div> -->
      <Paginator
        :rows="20"
        :total-records="searchTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handleSearchPageChange"
      />
    </div>
  </div>
</template>
