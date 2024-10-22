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
const popularTotal = ref(0);
const popularCurrentPage = ref(1);

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
  popularTotal.value = popularData.total_results;
};

const isShowSearchResult = ref(false);

const searchQuery = ref("");
let searchQueryLabel = "";

const searchResults = ref<ListType[]>([]);
const searchTotal = ref(0);
const searchCurrentPage = ref(1);

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
  await fetchPopularMovies(popularCurrentPage.value);
};

const handleSearchPageChange = async (event: PageState) => {
  console.log(event);
  searchCurrentPage.value = event.page + 1;
  await fetchSearchResults(searchCurrentPage.value);
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
      <Paginator
        :rows="20"
        :total-records="popularTotal"
        @page="handlePopularPageChange"
      />
    </div>

    <div v-if="searchResults.length > 0 && isShowSearchResult">
      <div class="text-3xl text-red b-1 b-amber">
        Search Results for '{{ searchQueryLabel }}'
      </div>
      <ListDumb :list="searchResults" />
      <div>total result is {{ searchTotal }}, {{ searchCurrentPage }}</div>
      <Paginator
        :rows="20"
        :total-records="searchTotal"
        @page="handleSearchPageChange"
      />
    </div>
  </div>
</template>
