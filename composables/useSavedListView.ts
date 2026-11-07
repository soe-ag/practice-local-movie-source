import type { DbMovie } from "~/utils/type";

/** Filter + sort state for a saved list (watch list, favorites). */
export const useSavedListView = (list: Ref<DbMovie[]> | ComputedRef<DbMovie[]>) => {
  const filters = reactive<SavedListFilters>({ type: "", rating: "", year: "" });
  const sort = ref<SortState>(null);

  const visibleList = computed(() =>
    sortSavedList(filterSavedList(list.value, filters), sort.value),
  );

  const setSort = (key: SortKey) => {
    sort.value = toggleSort(sort.value, key);
  };

  const reset = () => {
    filters.type = "";
    filters.rating = "";
    filters.year = "";
    sort.value = null;
  };

  return { filters, sort, visibleList, setSort, reset };
};
