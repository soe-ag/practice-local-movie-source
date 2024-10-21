<script setup>
import { ref, onMounted } from "vue";
import { useRuntimeConfig } from "#app";

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

const movies = ref([]);
const config = useRuntimeConfig();

const fetchPopularMovies = async () => {
  try {
    const response = await $fetch(
      `https://api.themoviedb.org/3/movie/popular`,
      {
        params: {
          api_key: config.public.tmdbApiKey,
          language: "en-US",
          page: 1,
        },
      }
    );
    movies.value = response.results;
    showMovies.value = true;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
  }
};

const isShowSearchResult = ref(false);
const searchResults = ref([]);
const searchQuery = ref("");
let searchQueryLabel = "";

const search = async () => {
  try {
    if (searchQuery.value.trim() === "") return; // Avoid empty searches

    const endpoint = `https://api.themoviedb.org/3/search/multi`;

    const response = await $fetch(endpoint, {
      params: {
        api_key: config.public.tmdbApiKey,
        include_adult: false,
        query: searchQuery.value,
        language: "en-US",
        page: 1,
      },
    });

    searchResults.value = response.results.filter(
      (item) => item.media_type !== "person"
    );
    isShowSearchResult.value = true;
    searchQueryLabel = searchQuery.value;
    searchQuery.value = "";
  } catch (error) {
    console.error("Error searching for movies or TV shows:", error);
  }
};

const handleEnter = (event) => {
  if (event.key === "Enter") {
    search();
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

    <div v-if="movies.length > 0 && !isShowSearchResult">
      <div class="text-4xl text-red b-1">Popular Movies</div>
      <div class="grid grid-cols-5 gap-2 justify-center items-center m-auto">
        <div v-for="movie in movies" :key="movie.id" class="m-auto">
          <div class="text-xl">{{ movie.title }}</div>
          <NuxtImg
            :src="`https://image.tmdb.org/t/p/w300${movie.poster_path}`"
            class="rounded-2"
          />
        </div>
      </div>
    </div>

    <div v-if="searchResults.length > 0 && isShowSearchResult">
      <div class="text-3xl text-red b-1 m-2 b-black">
        Search Results for '{{ searchQueryLabel }}'
      </div>
      <div class="grid grid-cols-5 gap-2 justify-center items-center m-auto">
        <div
          v-for="item in searchResults"
          :key="item.id"
          class="w-50 h-70 m-2 p-1 flex justify-center items-center flex-col"
        >
          <div class="text-sm h-10 text-center">
            {{ item.title ?? item.name }}
          </div>
          <NuxtImg
            :src="
              item.poster_path
                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                : '/images/default-movie-poster.jpg'
            "
            class="rounded-2 b-10 b-gray-1"
            width="150"
            height="210"
          />
        </div>
      </div>
    </div>
  </div>
</template>
