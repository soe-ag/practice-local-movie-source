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
    <Button label="Check" icon="pi pi-check" />

    <div class="text-4xl text-red b-1">Popular Movies</div>
    <div class="grid grid-cols-5 gap-2 justify-center items-center m-auto">
      <div v-for="movie in movies" :key="movie.id" class="m-auto">
        <h2>{{ movie.title }}</h2>
        <NuxtImg :src="`https://image.tmdb.org/t/p/w300${movie.poster_path}`" />
      </div>
    </div>
  </div>
</template>
