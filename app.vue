<script setup lang="ts">
// Main app component - layout and page routing
</script>

<template>
  <div class="font-sans bg-#0e1111">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- <div>
      <ul>
        <li v-for="movie in movies" :key="movie._id">{{ movie.title }}</li>
      </ul>
    </div> -->
  </div>
</template>
