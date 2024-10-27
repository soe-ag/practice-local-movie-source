<script setup lang="ts">
import { useRuntimeConfig } from "#app";
import type { PageState } from "primevue/paginator";
import type { DbMovie } from "~/utils/type";
// definePageMeta({ layout: "default" });

const popularMovies = ref<DbMovie[]>([]);
const popularTotal = ref(0);
const popularCurrentPage = ref(1);

const config = useRuntimeConfig();

const fetchPopularMovies = async (page: number) => {
  const popularData = await $fetch<RawList>(
    `https://api.themoviedb.org/3/movie/popular`,
    {
      params: {
        api_key: config.public.tmdbApiKey,
        language: "en-US",
        page,
      },
    }
  );

  popularMovies.value = popularData.results.map((item) =>
    convertToDbType(item)
  );
  popularTotal.value = popularData.total_results;
  isShowSearchResult.value = false;
  searchQuery.value = "";
};

const isShowSearchResult = ref(false);

const searchQuery = ref("");
let searchQueryLabel = "";

const searchResults = ref<DbMovie[]>([]);
const searchTotal = ref(0);
const searchCurrentPage = ref(1);

interface RawList {
  results: RawMovie[];
  total_results: number;
}

const fetchSearchResults = async (page: number) => {
  const searchData = await $fetch<RawList>(
    "https://api.themoviedb.org/3/search/multi",
    {
      params: {
        api_key: config.public.tmdbApiKey,
        include_adult: false,
        query: searchQuery.value,
        language: "en-US",
        page,
      },
    }
  );

  isShowSearchResult.value = true;

  searchQueryLabel = searchQuery.value; // for search query label
  // searchQuery.value = ""; if clear, pagination will not work

  searchResults.value = searchData.results
    .filter((item: { media_type: string }) => item.media_type !== "person")
    .map((item) => convertToDbType(item));
  searchTotal.value = searchData.total_results; // for pagination
};

// };

const handleEnter = async (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    await fetchSearchResults(1);
  }
};

const handlePopularPageChange = async (event: PageState) => {
  console.log(event);
  popularCurrentPage.value = event.page + 1;
  await fetchPopularMovies(popularCurrentPage.value);
};

const handleSearchPageChange = async (event: PageState) => {
  console.log(event);
  searchCurrentPage.value = event.page + 1;
  await fetchSearchResults(searchCurrentPage.value);
};

onMounted(() => {
  fetchPopularMovies(popularCurrentPage.value);
});
</script>

<template>
  <div class="py-2 mx-4">
    <div class="flex gap-4 my-2">
      <Button
        label="Trending"
        icon="i-material-symbols-kid-star-sharp"
        class=""
        :pt="{ label: { class: 'max-md:text-xs' } }"
        @click="fetchPopularMovies(1)"
      />

      <InputText
        v-model="searchQuery"
        type="text"
        variant="filled"
        placeholder="Search for a movie"
        size="small"
        @keydown="handleEnter"
      />
    </div>

    <div v-if="popularMovies.length > 0 && !isShowSearchResult">
      <div class="text-2xl text-gray my-2 text-center max-md:text-sm">
        ~ Trending Movies ~
      </div>
      <ListDumb :list="popularMovies" />
      <Paginator
        :rows="20"
        :total-records="popularTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handlePopularPageChange"
      />
    </div>

    <div v-if="searchResults.length > 0 && isShowSearchResult">
      <div class="text-2xl text-gray max-md:text-sm">
        Search Results for "{{ searchQueryLabel }}"
      </div>
      <ListDumb :list="searchResults" />
      <!-- <div>total result is {{ searchTotal }}, {{ searchCurrentPage }}</div> -->
      <Paginator
        :rows="20"
        :total-records="searchTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handleSearchPageChange"
      />
    </div>
  </div>
</template>
