<script setup lang="ts">
import { useRuntimeConfig } from "#app";
import type { PageState } from "primevue/paginator";
import type { DbMovie, RawMovieWithTotal } from "~/utils/type";
// definePageMeta({ layout: "default" });

const config = useRuntimeConfig();

const isShowTopRatedMovies = ref(true);
const isShowTopRatedSeries = ref(false);

const currentPage = ref(1);

const { data, refresh } = await useAsyncData(
  "fetchTopRatedMovies",
  () =>
    $fetch<RawMovieWithTotal>(`https://api.themoviedb.org/3/movie/top_rated`, {
      params: {
        api_key: config.public.tmdbApiKey,
        language: "en-US",
        page: currentPage.value,
      },
    }),
  { watch: [() => currentPage.value] } // re-fetch
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
    }
  );

  topRatedSeries.value = convertToDbType(rawTopRatedSeries).movies.filter(
    (item) => item.type !== "person"
  );
  topRatedSeriesTotal.value = rawTopRatedSeries.total_results; // for pagination
};

// };

const handleTopRatedSeries = async () => {
  await fetchTopRatedSeries(1);
};

const handlePopularPageChange = async (event: PageState) => {
  console.log(event);
  currentPage.value = event.page + 1;
  if (isShowTopRatedSeries.value) await fetchTopRatedSeries(currentPage.value);
};

// const handleSearchPageChange = async (event: PageState) => {
//   console.log(event);
//   searchCurrentPage.value = event.page + 1;
//   await fetchtopRatedSeries(searchCurrentPage.value);
// };
</script>

<template>
  <div class="py-2 mx-4">
    <Toast class="font-sans" />
    <div class="flex gap-4 my-2">
      <Button
        label="Top Rated Movies"
        icon="i-material-symbols-kid-star-sharp"
        class=""
        :pt="{ label: { class: 'max-md:text-xs' } }"
        @click="
          () => {
            currentPage = 1;
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
            isShowTopRatedMovies = false;
            isShowTopRatedSeries = true;
            handleTopRatedSeries();
          }
        "
      />
    </div>

    <div v-if="topRatedMovies.movies.length > 0 && isShowTopRatedMovies">
      <div class="text-2xl text-gray my-2 text-center max-md:text-sm">
        ~ Top Rated Movies ~
      </div>
      <ListDumb :list="topRatedMovies.movies" />
      <Paginator
        :rows="20"
        :total-records="topRatedMovies.totalResults"
        :pt="{ root: { class: '!bg-transparent' } }"
        @page="handlePopularPageChange"
      />
    </div>

    <div v-if="topRatedSeries && isShowTopRatedSeries">
      <div class="text-2xl text-gray my-2 text-center max-md:text-sm">
        ~ Top Rated Series ~
      </div>
      <ListDumb :list="topRatedSeries" />
      <Paginator
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
      <ListDumb :list="topRatedSeries" />
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
