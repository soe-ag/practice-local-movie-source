<script setup lang="ts">
const props = defineProps<{
  modelValue: HomeFilters;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [filters: HomeFilters];
}>();

const genres = computed(() => genresForType(props.modelValue.type));
const active = computed(() => isHomeFilterActive(props.modelValue));

const update = (patch: Partial<HomeFilters>) => {
  emit("update:modelValue", { ...props.modelValue, ...patch });
};

// Genre ids differ between movies and TV, so switching type clears the genre.
const onTypeChange = (event: Event) => {
  update({ type: (event.target as HTMLSelectElement).value as HomeMediaType, genre: "" });
};
const onGenreChange = (event: Event) => {
  update({ genre: (event.target as HTMLSelectElement).value });
};
const onRatingChange = (event: Event) => {
  update({ minRating: (event.target as HTMLSelectElement).value });
};
const onYearChange = (event: Event) => {
  update({ year: (event.target as HTMLSelectElement).value });
};

const selectClass =
  "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer disabled:opacity-50";
</script>

<template>
  <div class="flex gap-3 items-center flex-wrap text-sm my-2">
    <div class="font-semibold text-gray-400">Filter By:</div>
    <select
      :value="modelValue.type"
      :class="selectClass"
      :disabled="disabled"
      aria-label="Filter by type"
      @change="onTypeChange"
    >
      <option v-for="o in HOME_TYPE_OPTIONS" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <select
      :value="modelValue.genre"
      :class="selectClass"
      :disabled="disabled"
      aria-label="Filter by genre"
      @change="onGenreChange"
    >
      <option value="">All Genres</option>
      <option v-for="g in genres" :key="g.id" :value="String(g.id)">
        {{ g.name }}
      </option>
    </select>
    <select
      :value="modelValue.minRating"
      :class="selectClass"
      :disabled="disabled"
      aria-label="Filter by minimum rating"
      @change="onRatingChange"
    >
      <option v-for="o in HOME_MIN_RATING_OPTIONS" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <select
      :value="modelValue.year"
      :class="selectClass"
      :disabled="disabled"
      aria-label="Filter by release year"
      @change="onYearChange"
    >
      <option v-for="o in YEAR_FILTER_OPTIONS" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <Button
      v-if="active"
      label="Reset"
      icon="i-material-symbols-restart-alt-rounded"
      size="small"
      severity="secondary"
      class="!py-1 !px-3 !text-xs"
      @click="emit('update:modelValue', { ...DEFAULT_HOME_FILTERS })"
    />
  </div>
</template>
