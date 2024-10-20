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

onMounted(async () => {
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
  } catch (error) {
    console.error("Error fetching popular movies:", error);
  }
});
</script>

<template>
  <div>
    <Menubar :model="menuItems" class="mb-2" />
    <Button label="Check" icon="i-material-symbols-check-circle-rounded"
      ><NuxtLink to="/default" class="text-white no-underline"
        >To Default Page</NuxtLink
      ></Button
    >

    <div class="text-4xl text-red b-1">Popular Movies</div>
    <div class="grid grid-cols-5 gap-2 justify-center items-center m-auto">
      <div v-for="movie in movies" :key="movie.id" class="m-auto">
        <h4>{{ movie.title }}</h4>
        <NuxtImg
          :src="`https://image.tmdb.org/t/p/w300${movie.poster_path}`"
          class="rounded-2"
        />
      </div>
    </div>
  </div>
</template>
