<script setup lang="ts">
import { useRuntimeConfig } from "#app";
import type { ListType } from "~/components/ListDumb.vue";
import type { PageState } from "primevue/paginator";
// import type { ListType } from "./List.vue";

const menuItems = ref([
  {
    label: "Home",
    icon: "i-material-symbols-home-rounded",
  },
  {
    label: "Default",
    icon: "i-logos-nuxt-icon",
  },
  {
    label: "Save",
    icon: "i-material-symbols-save-rounded",
  },
  {
    label: "Others",
    icon: "i-material-symbols-movie-filter",
  },
]);

const popularMovies = ref<ListType[]>([]);
const config = useRuntimeConfig();

const fetchPopularMovies = async (page: number) => {
  const popularData = await $fetch<SearchResponse>(
    `https://api.themoviedb.org/3/movie/popular`,
    {
      params: {
        api_key: config.public.tmdbApiKey,
        language: "en-US",
        page,
      },
    }
  );

  popularMovies.value = popularData.results;
};

const isShowSearchResult = ref(false);
const searchResults = ref<ListType[]>([]);
const searchQuery = ref("");
let searchQueryLabel = "";
const totalResults = ref(0);
const currentPage = ref(1);

// const searchMovies = async () => {
// catch (error) {
//   console.error("Error searching for movies or TV shows:", error);
// }

interface SearchResponse {
  results: ListType[];
  total_results: number;
}

const fetchSearchResults = async (page: number) => {
  const searchData = await $fetch<SearchResponse>(
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

  isShowSearchResult.value = true;

  searchQueryLabel = searchQuery.value; // for search query label
  // searchQuery.value = ""; if clear, pagination will not work

  searchResults.value = searchData.results.filter(
    (item: { media_type: string }) => item.media_type !== "person"
  );
  totalResults.value = searchData.total_results; // for pagination
};

// };

const handleEnter = async (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    await fetchSearchResults(1);
  }
};

const handlePageChange = async (event: PageState) => {
  console.log(event);
  currentPage.value = event.page + 1;
  await fetchSearchResults(currentPage.value);
};
</script>

<template>
  <div>
    <Menubar :model="menuItems" class="mb-2" />
    <!-- <Button label="Check" icon="i-material-symbols-check-circle-rounded"
      ><NuxtLink to="/default" class="text-white no-underline"
        >To Default Page</NuxtLink
      ></Button
    > -->

    <Button
      label="Show Popular Movies"
      icon="i-material-symbols-check-circle-rounded"
      class="m-2"
      @click="fetchPopularMovies(1)"
    />

    <InputText
      v-model="searchQuery"
      type="text"
      variant="filled"
      class="m-2"
      @keydown="handleEnter"
    />

    <div v-if="popularMovies.length > 0 && !isShowSearchResult">
      <div class="text-3xl text-red b-1 b-amber">Popular Movies</div>
      <ListDumb :list="popularMovies" />
    </div>

    <div v-if="searchResults.length > 0 && isShowSearchResult">
      <div class="text-3xl text-red b-1 b-amber">
        Search Results for '{{ searchQueryLabel }}'
      </div>
      <Paginator
        :rows="20"
        :total-records="totalResults"
        @page="handlePageChange"
      />
      <ListDumb :list="searchResults" />
      <div>total result is {{ totalResults }}, {{ currentPage }}</div>
      <Paginator
        :rows="20"
        :total-records="totalResults"
        @page="handlePageChange"
      />
    </div>
  </div>
</template>
