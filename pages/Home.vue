<script setup lang="ts">
import { useRuntimeConfig } from "#app";
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

const popularMovies = ref([]);
const config = useRuntimeConfig();

const fetchPopularMovies = async () => {
  try {
    popularMovies.value = await $fetch(
      `https://api.themoviedb.org/3/movie/popular`,
      {
        params: {
          api_key: config.public.tmdbApiKey,
          language: "en-US",
          page: 1,
        },
      }
    ).then((response: any) => response.results);
    console.log(popularMovies.value);
  } catch (error) {
    console.error("Error fetching popular movies:", error);
  }
};

const isShowSearchResult = ref(false);
const searchResults = ref([]);
const searchQuery = ref("");
let searchQueryLabel = "";

const searchMovies = async () => {
  try {
    if (searchQuery.value.trim() === "") return; // Avoid empty searches
    const endpoint = `https://api.themoviedb.org/3/search/multi`;

    searchResults.value = await $fetch(endpoint, {
      params: {
        api_key: config.public.tmdbApiKey,
        include_adult: false,
        query: searchQuery.value,
        language: "en-US",
        page: 1,
      },
    }).then((response: any) => {
      return response.results.filter(
        (item: { media_type: string }) => item.media_type !== "person"
      );
    });
    isShowSearchResult.value = true;
    searchQueryLabel = searchQuery.value;
    searchQuery.value = "";
  } catch (error) {
    console.error("Error searching for movies or TV shows:", error);
  }
};

const handleEnter = (event: { key: string }) => {
  if (event.key === "Enter") {
    searchMovies();
  }
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
      @click="fetchPopularMovies"
      class="m-2"
    />

    <InputText
      type="text"
      v-model="searchQuery"
      variant="filled"
      @keydown="handleEnter"
      class="m-2"
    />

    <div v-if="popularMovies.length > 0 && !isShowSearchResult">
      <div class="text-3xl text-red b-1 b-amber">Popular Movies</div>
      <List :list="popularMovies" />
    </div>

    <div v-if="searchResults.length > 0 && isShowSearchResult">
      <div class="text-3xl text-red b-1 b-amber">
        Search Results for '{{ searchQueryLabel }}'
      </div>
      <List :list="searchResults" />
    </div>
  </div>
</template>
