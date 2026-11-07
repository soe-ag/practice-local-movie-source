<script setup lang="ts">
import type { DbMovie } from "~/utils/type";

const props = defineProps<{
  list: DbMovie[];
  pending: boolean;
  emptyText: string;
  /** Show the "Date Added" sort option. */
  sortByDateAdded?: boolean;
}>();

const emit = defineEmits<{
  removeFromList: [id: number, type: string, name: string];
}>();

const listRef = toRef(props, "list");
const { filters, sort, visibleList, setSort, reset } = useSavedListView(listRef);

const sortOptions = computed<{ key: SortKey; label: string }[]>(() => [
  ...(props.sortByDateAdded ? [{ key: "date" as const, label: "Date Added" }] : []),
  { key: "year", label: "Year" },
  { key: "rating", label: "Rating" },
]);

const selectClass =
  "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded p-1.5 text-sm outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 cursor-pointer";
const gridClass =
  "flex flex-wrap justify-start items-start px-2 my-4 md:px-8 max-w-[1400px] mx-auto";
</script>

<template>
  <div class="py-2">
    <div
      class="flex flex-col xl:flex-row gap-4 mx-4 xl:justify-between items-start xl:items-center text-sm mb-4"
    >
      <div class="flex gap-3 items-center flex-wrap">
        <div class="font-semibold text-gray-400">Filter By:</div>
        <select v-model="filters.type" :class="selectClass" aria-label="Filter by type">
          <option v-for="o in TYPE_FILTER_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
        <select v-model="filters.rating" :class="selectClass" aria-label="Filter by rating">
          <option v-for="o in RATING_FILTER_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
        <select v-model="filters.year" :class="selectClass" aria-label="Filter by year">
          <option v-for="o in YEAR_FILTER_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
        <Button
          label="Reset"
          icon="i-material-symbols-restart-alt-rounded"
          size="small"
          severity="secondary"
          class="!py-1 !px-3 !text-xs"
          @click="reset"
        />
      </div>

      <div class="flex gap-4 items-center">
        <div class="font-semibold text-gray-400">Sorted By:</div>
        <div
          v-for="option in sortOptions"
          :key="option.key"
          class="cursor-pointer hover:text-blue flex items-center"
          :class="{ 'font-bold text-blue': sort?.key === option.key }"
          @click="setSort(option.key)"
        >
          {{ option.label }}
          <div
            v-if="sort?.key === option.key && sort.direction === 'ascending'"
            class="i-material-symbols-arrow-upward-alt"
          />
          <div
            v-if="sort?.key === option.key && sort.direction === 'descending'"
            class="i-material-symbols-arrow-downward-alt"
          />
        </div>
      </div>
    </div>

    <div v-if="pending" :class="gridClass">
      <ItemSkeleton :count="20" />
    </div>

    <div v-else>
      <div v-if="visibleList.length" :class="gridClass">
        <ItemDumb
          :list="visibleList"
          :is-list="false"
          @remove-from-list="(id, type, name) => emit('removeFromList', id, type, name)"
        />
      </div>
      <div v-else class="mx-4">{{ emptyText }}</div>
    </div>
  </div>
</template>
