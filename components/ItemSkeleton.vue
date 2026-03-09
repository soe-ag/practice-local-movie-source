<script setup lang="ts">
const props = defineProps({
  count: {
    type: Number,
    default: 10,
  },
});
</script>

<template>
  <div v-for="i in props.count" :key="i" class="w-40 h-64 m-2 flex flex-col">
    <!-- Poster skeleton -->
    <Skeleton class="w-full h-56 rounded-lg mb-2 flex-shrink-0" />
    <!-- Title skeleton -->
    <Skeleton class="w-[80%] h-3 mb-1" />
    <!-- Year skeleton -->
    <Skeleton class="w-[40%] h-3" />
  </div>
</template>
