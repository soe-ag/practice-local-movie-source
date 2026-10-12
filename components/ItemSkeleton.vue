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
    <div
      class="w-full h-56 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 shadow-md animate-pulse dark:bg-gray-700"
      aria-hidden="true"
    />
  </div>
</template>
