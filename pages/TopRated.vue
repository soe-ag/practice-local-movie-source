<script setup lang="ts">
import { useRuntimeConfig } from "#app";
import type { PageState } from "primevue/paginator";
import type { DbMovie, RawMovieWithTotal } from "~/utils/type";
// definePageMeta({ layout: "default" });

const config = useRuntimeConfig();

const isShowTopRatedMovies = ref(true);
const isShowTopRatedSeries = ref(false);

const currentPage = ref(1);
const popularFirst = ref(0);

const { data } = await useAsyncData(
  "fetchTopRatedMovies",
  () =>
    $fetch<RawMovieWithTotal>(`https://api.themoviedb.org/3/movie/top_rated`, {
      params: {
        api_key: config.public.tmdbApiKey,
        language: "en-US",
        page: currentPage.value,
      },
    }),
  { watch: [() => currentPage.value] }, // re-fetch
);

const topRatedMovies = computed(() => {
  if (data.value) {
    // isShowTopRatedSeries.value = false;

    return convertToDbType(data.value);
  } else return { movies: [], totalResults: 0 };
});

// search function area

const topRatedSeries = ref<DbMovie[]>([]);
const topRatedSeriesTotal = ref(0);
const seriesFirst = ref(0);
// const searchCurrentPage = ref(1);

const fetchTopRatedSeries = async (page: number) => {
  const rawTopRatedSeries = await $fetch<RawMovieWithTotal>(
    "https://api.themoviedb.org/3/tv/top_rated",
    {
      params: {
        api_key: config.public.tmdbApiKey,
        include_adult: false,
        language: "en-US",
        page,
      },
    },
  );

  topRatedSeries.value = convertToDbType(rawTopRatedSeries).movies.filter(
    (item) => item.type !== "person",
  );
  topRatedSeriesTotal.value = rawTopRatedSeries.total_results; // for pagination
};

// };

const handleTopRatedSeries = async () => {
  await fetchTopRatedSeries(1);
};

const handlePopularPageChange = async (event: PageState) => {
  currentPage.value = event.page + 1;
  if (isShowTopRatedSeries.value) {
    await fetchTopRatedSeries(currentPage.value);
  }
};
</script>

<template>
  <div class="py-2 mx-4">
    <Toast class="font-sans" />
    <div
      class="flex flex-col md:flex-row gap-4 my-2 md:items-center justify-between lg:mx-[110px]"
    >
      <!-- Header Area (Now on Left) -->
      <div v-if="topRatedMovies.movies.length > 0 && isShowTopRatedMovies">
        <div
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-center max-md:text-xl flex items-center justify-center gap-3 drop-shadow-sm transition-all hover:scale-105"
        >
          <div class="i-material-symbols-movie-filter" />
          Top Rated Movies
        </div>
      </div>

      <div v-if="topRatedSeries.length > 0 && isShowTopRatedSeries">
        <div
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 text-center max-md:text-xl flex items-center justify-center gap-3 drop-shadow-sm transition-all hover:scale-105"
        >
          <div class="i-material-symbols-live-tv-rounded" />
          Top Rated Series
        </div>
      </div>

      <!-- Action Buttons (Now on Right) -->
      <div class="flex gap-4">
        <Button
          label="Top Rated Movies"
          icon="i-material-symbols-kid-star-sharp"
          class=""
          :pt="{ label: { class: 'max-md:text-xs' } }"
          @click="
            () => {
              currentPage = 1;
              popularFirst = 0;
              isShowTopRatedMovies = true;
              isShowTopRatedSeries = false;
            }
          "
        />

        <Button
          label="Top Rated Series"
          icon="i-material-symbols-kid-star-sharp"
          class=""
          :pt="{ label: { class: 'max-md:text-xs' } }"
          @click="
            () => {
              currentPage = 1;
              seriesFirst = 0;
              isShowTopRatedMovies = false;
              isShowTopRatedSeries = true;
              handleTopRatedSeries();
            }
          "
        />
      </div>
    </div>

    <div v-if="topRatedMovies.movies.length > 0 && isShowTopRatedMovies">
      <ItemSmart :list="topRatedMovies.movies" />
      <Paginator
        v-model:first="popularFirst"
        :rows="20"
        :total-records="topRatedMovies.totalResults"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handlePopularPageChange"
      />
    </div>

    <div v-if="topRatedSeries.length > 0 && isShowTopRatedSeries">
      <ItemSmart :list="topRatedSeries" />
      <Paginator
        v-model:first="seriesFirst"
        :rows="20"
        :total-records="topRatedSeriesTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handlePopularPageChange"
      />
    </div>

    <!-- <div v-if="topRatedSeries.length > 0 && isShowSearchResult">
      <div class="text-2xl text-gray max-md:text-sm">
        Search Results for "{{ searchQueryLabel }}"
      </div>
      <ItemSmart :list="topRatedSeries" />
      <div>total result is {{ topRatedSeriesTotal }}, {{ searchCurrentPage }}</div>
      <Paginator
        :rows="20"
        :total-records="topRatedSeriesTotal"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handleSearchPageChange"
      />
    </div> -->
  </div>
</template>
