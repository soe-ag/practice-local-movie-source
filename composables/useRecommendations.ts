import { useDebounceFn } from "@vueuse/core";
import type { PageState } from "primevue/paginator";
import type {
  DbMovie,
  RawMovieWithTotal,
  RecommendationCandidate,
  RecommendationGroup,
  RecommendationResponse,
  RecommendationSeed,
  RecommendationSource,
} from "~/utils/type";
import {
  buildRecommendations,
  mapRecommendationItemsToCandidates,
  matchesRecommendationFilters,
  mediaKey,
  paginateRecommendations,
  recommendationEndpoint,
  toggleSingleSelection,
} from "~/utils/recommendations";

type RecommendationTab = "forYou" | "findSimilar";

type TabState = {
  groups: RecommendationGroup[];
  stale: boolean;
  error: string | null;
  generating: boolean;
  requestId: number;
  response: RecommendationResponse | null;
};

const createTabState = (): TabState => ({
  groups: [],
  stale: false,
  error: null,
  generating: false,
  requestId: 0,
  response: null,
});

export const useRecommendations = (options: {
  favorites: Ref<DbMovie[]> | ComputedRef<DbMovie[]>;
  watchList: Ref<DbMovie[]> | ComputedRef<DbMovie[]>;
}) => {
  const config = useRuntimeConfig();
  const toast = useToast();
  const route = useRoute();
  const router = useRouter();

  const activeTab = ref<RecommendationTab>(
    route.query.tab === "findSimilar" ? "findSimilar" : "forYou",
  );
  const recommendationSource = ref<RecommendationSource>(
    route.query.source === "tmdb" ? "tmdb" : "ai",
  );
  const useAiRecommendations = computed({
    get: () => recommendationSource.value === "ai",
    set: (enabled: boolean) => {
      recommendationSource.value = enabled ? "ai" : "tmdb";
    },
  });
  const selectedFavoriteKeys = ref<string[]>([]);
  const selectedManualSeeds = ref<RecommendationSeed[]>([]);
  const searchQuery = ref("");
  const searchResults = ref<DbMovie[]>([]);
  const isSearchPending = ref(false);
  const filterType = ref(typeof route.query.mediaType === "string" ? route.query.mediaType : "");
  const filterRating = ref(typeof route.query.rating === "string" ? route.query.rating : "");
  const filterGenre = ref(typeof route.query.genre === "string" ? route.query.genre : "");
  const resultPage = ref(1);
  const resultFirst = ref(0);
  const tabState = reactive<Record<RecommendationTab, TabState>>({
    forYou: createTabState(),
    findSimilar: createTabState(),
  });

  const selectedFavoriteSeeds = computed<RecommendationSeed[]>(() => {
    const selected = new Set(selectedFavoriteKeys.value);
    return options.favorites.value.filter((movie) => selected.has(mediaKey(movie)));
  });
  const currentSeeds = computed(() =>
    activeTab.value === "forYou"
      ? selectedFavoriteSeeds.value
      : selectedManualSeeds.value,
  );
  const currentState = computed(() => tabState[activeTab.value]);
  const excludedKeys = computed(() => {
    const keys = new Set<string>();
    for (const movie of options.favorites.value) keys.add(mediaKey(movie));
    for (const movie of options.watchList.value) keys.add(mediaKey(movie));
    for (const seed of currentSeeds.value) keys.add(mediaKey(seed));
    return keys;
  });

  const recommendationCandidates = (response: RecommendationResponse | null) =>
    response ? mapRecommendationItemsToCandidates(response.recommendations) : [];

  const rankedRecommendations = computed<RecommendationCandidate[]>(() => {
    const response = currentState.value.response;
    if (response) {
      return recommendationCandidates(response)
        .filter((candidate) => !excludedKeys.value.has(mediaKey(candidate)))
        .filter((candidate) =>
          matchesRecommendationFilters(candidate, {
            type: filterType.value,
            rating: filterRating.value,
            genre: filterGenre.value,
          }),
        );
    }
    return buildRecommendations({
      groups: currentState.value.groups,
      excludedKeys: excludedKeys.value,
      filters: {
        type: filterType.value,
        rating: filterRating.value,
        genre: filterGenre.value,
      },
    });
  });
  const unfilteredRecommendations = computed<RecommendationCandidate[]>(() =>
    currentState.value.response
      ? recommendationCandidates(currentState.value.response).filter(
          (candidate) => !excludedKeys.value.has(mediaKey(candidate)),
        )
      : buildRecommendations({
          groups: currentState.value.groups,
          excludedKeys: excludedKeys.value,
        }),
  );
  const paginatedRecommendations = computed(() =>
    paginateRecommendations(rankedRecommendations.value, resultPage.value),
  );

  const resetFilters = () => {
    filterType.value = "";
    filterRating.value = "";
    filterGenre.value = "";
    resultPage.value = 1;
    resultFirst.value = 0;
  };

  const markCurrentResultsStale = () => {
    currentState.value.error = null;
    if (currentState.value.groups.length) currentState.value.stale = true;
  };

  const toggleFavoriteSeed = (movie: DbMovie) => {
    selectedFavoriteKeys.value = toggleSingleSelection(
      selectedFavoriteKeys.value,
      mediaKey(movie),
    );
    markCurrentResultsStale();
  };

  const addManualSeed = (movie: DbMovie) => {
    selectedManualSeeds.value = [movie];
    searchQuery.value = "";
    searchResults.value = [];
    markCurrentResultsStale();
  };

  const removeManualSeed = (seed: RecommendationSeed) => {
    selectedManualSeeds.value = selectedManualSeeds.value.filter(
      (item) => mediaKey(item) !== mediaKey(seed),
    );
    markCurrentResultsStale();
  };

  let searchRequestId = 0;
  let searchController: AbortController | null = null;
  const searchTitles = useDebounceFn(async (query: string, requestId: number) => {
    searchController?.abort();
    searchController = new AbortController();
    try {
      const response = await $fetch<RawMovieWithTotal>(
        "https://api.themoviedb.org/3/search/multi",
        {
          params: {
            api_key: config.public.tmdbApiKey,
            include_adult: false,
            language: "en-US",
            page: 1,
            query,
          },
          signal: searchController.signal,
        },
      );
      if (requestId !== searchRequestId) return;
      searchResults.value = convertToDbType(response).movies
        .filter((item) => item.type === "movie" || item.type === "tv")
        .slice(0, 8);
    } catch (error) {
      if (requestId !== searchRequestId || (error as { name?: string }).name === "AbortError") return;
      searchResults.value = [];
      toast.add({ severity: "error", summary: "Search failed", detail: "Could not search TMDB. Try again.", life: 3000 });
    } finally {
      if (requestId === searchRequestId) isSearchPending.value = false;
    }
  }, 350);

  watch(searchQuery, (value) => {
    const requestId = ++searchRequestId;
    const query = value.trim();
    if (query.length < 2) {
      searchController?.abort();
      searchResults.value = [];
      isSearchPending.value = false;
      return;
    }
    isSearchPending.value = true;
    searchTitles(query, requestId);
  });

  const generateRecommendations = async () => {
    const tab = activeTab.value;
    const seeds = [...currentSeeds.value];
    if (!seeds.length) return;
    const state = tabState[tab];
    const source = recommendationSource.value;
    const currentRequestId = ++state.requestId;
    state.generating = true;
    state.error = null;
    try {
      const seed = seeds[0]!;
      const response = await $fetch<RecommendationResponse>(recommendationEndpoint(source), {
        method: "POST",
        body: { id: seed.id, type: seed.type },
      });
      if (currentRequestId !== state.requestId || source !== recommendationSource.value) return;
      state.response = response;
      state.groups = [{ seed, candidates: response.recommendations.map((item) => item.movie) }];
      state.stale = false;
      resultPage.value = 1;
      resultFirst.value = 0;
    } catch {
      if (currentRequestId !== state.requestId || source !== recommendationSource.value) return;
      state.response = null;
      state.groups = [];
      state.error = `Could not load ${source === "ai" ? "AI" : "TMDB"} recommendations.`;
    } finally {
      if (currentRequestId === state.requestId) state.generating = false;
    }
  };

  watch([filterType, filterRating, filterGenre], () => {
    resultPage.value = 1;
    resultFirst.value = 0;
  });
  watch([activeTab, recommendationSource, filterType, filterRating, filterGenre, currentSeeds], () => {
    const query: Record<string, string> = {
      tab: activeTab.value,
      source: recommendationSource.value,
    };
    if (filterType.value) query.mediaType = filterType.value;
    if (filterRating.value) query.rating = filterRating.value;
    if (filterGenre.value) query.genre = filterGenre.value;
    const seed = currentSeeds.value[0];
    if (seed && activeTab.value === "forYou") {
      query.seedId = String(seed.id);
      query.seedType = seed.type;
    }
    if (activeTab.value === "findSimilar" && route.query.id && route.query.type) {
      query.id = String(route.query.id);
      query.type = String(route.query.type);
    }
    router.replace({ query });
  }, { flush: "post" });
  watch(activeTab, () => {
    resetFilters();
    searchResults.value = [];
  });
  watch(recommendationSource, () => {
    for (const state of Object.values(tabState)) {
      state.requestId += 1;
      state.generating = false;
      state.error = null;
      state.stale = false;
      state.groups = [];
      state.response = null;
    }
    resultPage.value = 1;
    resultFirst.value = 0;
  });

  const handleResultPageChange = (event: PageState) => {
    resultPage.value = event.page + 1;
  };

  return {
    activeTab,
    recommendationSource,
    useAiRecommendations,
    selectedFavoriteKeys,
    selectedManualSeeds,
    searchQuery,
    searchResults,
    isSearchPending,
    filterType,
    filterRating,
    filterGenre,
    currentSeeds,
    currentState,
    rankedRecommendations,
    unfilteredRecommendations,
    paginatedRecommendations,
    resultFirst,
    resetFilters,
    toggleFavoriteSeed,
    addManualSeed,
    removeManualSeed,
    generateRecommendations,
    handleResultPageChange,
  };
};
