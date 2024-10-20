<script setup>
import { ref, onMounted } from "vue";
import { useRuntimeConfig } from "#app";

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
    <h1 class="text-3xl">Popular Movies</h1>
    <div v-for="movie in movies" :key="movie.id">
      <h2>{{ movie.title }}</h2>
      <NuxtImg :src="`https://image.tmdb.org/t/p/w300${movie.poster_path}`" />
    </div>
  </div>
</template>
