<script setup lang="ts">
import { computed } from "vue";
const props = defineProps({
  count: {
    type: Number,
    default: 20,
  },
});

const itemsPerRow = computed(() => 5);

const chunkedList = computed(() => {
  const chunks = [];
  if (props.count > 0) {
    for (let i = 0; i < props.count; i += itemsPerRow.value) {
      const chunk = [];
      for (let j = 0; j < itemsPerRow.value && i + j < props.count; j++) {
        chunk.push(i + j);
      }
      chunks.push(chunk);
    }
  }
  return chunks;
});
</script>

<template>
  <div
    class="flex flex-col gap-3 sm:gap-4 w-full pt-12 pb-0 px-2 overflow-x-hidden"
  >
    <div
      v-for="(row, rowIndex) in chunkedList"
      :key="rowIndex"
      class="stacked-row"
    >
      <div
        v-for="(i, index) in row"
        :key="i"
        class="stacked-item flex flex-col"
        :style="{ zIndex: 50 - index }"
      >
        <!-- Poster skeleton -->
        <Skeleton class="w-full aspect-[2/3] rounded-lg mb-3 flex-shrink-0" />
        <!-- Title skeleton -->
        <Skeleton class="w-[80%] h-4 mb-2" />
        <!-- Year skeleton -->
        <Skeleton class="w-[40%] h-3" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stacked-row {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  width: 100%;
  padding: 20px 20px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}
.stacked-row::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

@media (min-width: 640px) {
  .stacked-row {
    justify-content: center;
    padding: 10px 0;
    overflow-x: visible;
  }
}
.stacked-item {
  width: 126px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  flex-shrink: 0;
}
/* Stacking overlap (approx 10% of card width) */
.stacked-item:not(:first-child) {
  margin-left: -13px;
}

@media (min-width: 640px) {
  .stacked-item {
    width: 160px;
  }
  .stacked-item:not(:first-child) {
    margin-left: -16px;
  }
}
@media (min-width: 768px) {
  .stacked-item {
    width: 198px;
  }
  .stacked-item:not(:first-child) {
    margin-left: -20px;
  }
}
@media (min-width: 1024px) {
  .stacked-item {
    width: 234px;
  }
  .stacked-item:not(:first-child) {
    margin-left: -23px;
  }
}
</style>
