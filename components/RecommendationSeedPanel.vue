<script setup lang="ts">
import type {
  DbMovie,
  RecommendationSeed,
  RecommendationSource,
  SegmentedOption,
} from "~/utils/type";
import { mediaKey } from "~/utils/recommendations";

type Mode = "forYou" | "findSimilar";
type Seed = RecommendationSeed & Partial<DbMovie>;

const props = defineProps<{
  mode: Mode;
  source: RecommendationSource;
  favorites: DbMovie[];
  favoritesLoading: boolean;
  selectedFavoriteKeys: string[];
  searchQuery: string;
  searchResults: DbMovie[];
  isSearchPending: boolean;
  seed: Seed | null;
  generating: boolean;
}>();

const emit = defineEmits<{
  "update:mode": [mode: Mode];
  "update:source": [source: RecommendationSource];
  "update:searchQuery": [query: string];
  toggleFavorite: [movie: DbMovie];
  pickSearchResult: [movie: DbMovie];
  clear: [];
  generate: [];
}>();

const modeOptions: SegmentedOption<Mode>[] = [
  { value: "forYou", label: "Favorites", icon: "i-material-symbols-favorite-rounded" },
  { value: "findSimilar", label: "Search", icon: "i-material-symbols-search-rounded" },
];
const sourceOptions: SegmentedOption<RecommendationSource>[] = [
  { value: "ai", label: "AI picks", icon: "i-material-symbols-auto-awesome-rounded" },
  { value: "tmdb", label: "Similar titles", icon: "i-material-symbols-movie-rounded" },
];

const isSelected = (movie: DbMovie) => props.selectedFavoriteKeys.includes(mediaKey(movie));
const seedTypeLabel = computed(() => (props.seed?.type === "tv" ? "TV Series" : "Movie"));
const seedGenres = computed(() => (props.seed?.genres ?? []).slice(0, 3));
</script>

<template>
  <section
    class="relative z-10 rounded-2xl border border-white/50 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-4 shadow-2xl backdrop-blur-md sm:p-6" aria-labelledby="seed-heading">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SegmentedControl
        :model-value="mode"
        :options="modeOptions"
        label="Where to pick your title from"
        tabs
        @update:model-value="emit('update:mode', $event)"
      />
      <SegmentedControl
        :model-value="source"
        :options="sourceOptions"
        label="Recommendation source"
        @update:model-value="emit('update:source', $event)"
      />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <!-- Picker -->
      <div class="min-w-0">
        <h2 id="seed-heading" class="text-lg font-bold">
          {{ mode === "forYou" ? "Pick a favorite" : "Search for a title you love" }}
        </h2>
        <p class="mt-0.5 mb-4 text-sm text-gray-500 dark:text-gray-400">
          {{
            mode === "forYou"
              ? "We'll find more titles like the one you choose."
              : "Any movie or TV series works. Pick one from the results."
          }}
        </p>

        <template v-if="mode === 'forYou'">
          <div v-if="favoritesLoading" class="flex gap-3 overflow-hidden" aria-hidden="true">
            <div
              v-for="i in 6"
              :key="i"
              class="w-28 shrink-0 aspect-[2/3] rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          </div>

          <div v-else-if="favorites.length" class="rec-shelf" role="group" aria-label="Your favorites">
            <button
              v-for="movie in favorites"
              :key="mediaKey(movie)"
              type="button"
              class="rec-shelf-item group relative w-28 shrink-0 snap-start text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              :aria-pressed="isSelected(movie)"
              @click="emit('toggleFavorite', movie)"
            >
              <span
                class="relative block aspect-[2/3] overflow-hidden rounded-xl ring-2 transition-all"
                :class="
                  isSelected(movie)
                    ? 'ring-orange-500 shadow-lg shadow-orange-500/30 scale-[1.03]'
                    : 'ring-transparent opacity-80 group-hover:opacity-100'
                "
              >
                <NuxtImg
                  :src="movie.posterUrl"
                  :alt="movie.title"
                  width="112"
                  height="168"
                  loading="lazy"
                  class="h-full w-full object-cover"
                />
                <span
                  v-if="isSelected(movie)"
                  class="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white"
                  aria-hidden="true"
                >
                  <span class="i-material-symbols-check-rounded" />
                </span>
              </span>
              <span class="mt-1.5 block truncate px-0.5 text-xs font-medium">{{ movie.title }}</span>
            </button>
          </div>

          <div
            v-else
            class="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center"
          >
            <span
              class="i-material-symbols-favorite-outline-rounded text-4xl text-gray-400"
              aria-hidden="true"
            />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You haven't saved any favorites yet.
            </p>
            <div class="mt-3 flex justify-center gap-2 text-sm font-semibold">
              <NuxtLink to="/" class="text-orange-600 dark:text-orange-400 hover:underline">
                Browse popular
              </NuxtLink>
              <span class="text-gray-400" aria-hidden="true">·</span>
              <NuxtLink to="/TopRated" class="text-orange-600 dark:text-orange-400 hover:underline">
                Top rated
              </NuxtLink>
              <span class="text-gray-400" aria-hidden="true">·</span>
              <button
                type="button"
                class="text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                @click="emit('update:mode', 'findSimilar')"
              >
                Search instead
              </button>
            </div>
          </div>
        </template>

        <div v-else class="relative max-w-xl">
          <label for="recommendation-search" class="sr-only">Search movies or TV series</label>
          <span
            class="i-material-symbols-search-rounded pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-gray-400"
            aria-hidden="true"
          />
          <input
            id="recommendation-search"
            :value="searchQuery"
            type="search"
            name="recommendation-search"
            autocomplete="off"
            placeholder="Try &quot;Inception&quot; or &quot;Breaking Bad&quot;"
            class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 pl-11 pr-16 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
            @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          >
          <span
            v-if="isSearchPending"
            class="pointer-events-none absolute inset-y-0 right-11 flex items-center"
            role="status"
            aria-label="Searching"
          >
            <span class="i-material-symbols-progress-activity animate-spin text-lg text-gray-400" aria-hidden="true" />
          </span>
          <div
            v-if="searchResults.length"
            class="absolute z-20 mt-2 max-h-[min(24rem,60vh)] w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl"
            role="listbox"
            aria-label="Search results"
          >
            <button
              v-for="movie in searchResults"
              :key="mediaKey(movie)"
              type="button"
              role="option"
              :aria-selected="false"
              class="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
              @click="emit('pickSearchResult', movie)"
            >
              <NuxtImg
                :src="movie.posterUrl"
                :alt="movie.title"
                width="36"
                height="54"
                loading="lazy"
                class="h-[54px] w-9 rounded object-cover"
              />
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold">{{ movie.title }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">
                  {{ movie.type === "tv" ? "TV Series" : "Movie" }} · {{ movie.release ?? "Year N/A" }}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Selected title -->
      <aside class="min-w-0" aria-label="Selected title">
        <div
          class="relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-white/10 bg-gray-100/70 dark:bg-gray-900/60 p-4"
        >
          <template v-if="seed">
            <NuxtImg
              :src="seed.posterUrl"
              alt=""
              width="64"
              height="96"
              class="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover opacity-30 blur-2xl"
              aria-hidden="true"
            />
            <div class="relative flex gap-4">
              <NuxtImg
                :src="seed.posterUrl"
                :alt="`${seed.title} poster`"
                width="96"
                height="144"
                class="h-36 w-24 shrink-0 rounded-lg object-cover shadow-xl"
              />
              <div class="min-w-0">
                <p class="text-[11px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                  Because you liked
                </p>
                <h3 class="mt-0.5 text-lg font-extrabold leading-tight line-clamp-2" :title="seed.title">
                  {{ seed.title }}
                </h3>
                <p class="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-600 dark:text-gray-300">
                  <span>{{ seedTypeLabel }}</span>
                  <span v-if="seed.release">· {{ seed.release }}</span>
                  <span v-if="seed.rating" class="inline-flex items-center gap-0.5">
                    ·
                    <span class="i-material-symbols-star-rounded text-yellow-500" aria-hidden="true" />
                    {{ seed.rating.toFixed(1) }}
                  </span>
                </p>
                <div v-if="seedGenres.length" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="genre in seedGenres"
                    :key="genre"
                    class="rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium"
                  >
                    {{ genre }}
                  </span>
                </div>
              </div>
            </div>
            <p
              v-if="seed.overview"
              class="relative mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3"
            >
              {{ seed.overview }}
            </p>
          </template>

          <div v-else class="flex flex-col items-center justify-center py-8 text-center">
            <span class="i-material-symbols-movie-edit-outline-rounded text-4xl text-gray-400" aria-hidden="true" />
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Your pick shows up here</p>
          </div>
        </div>

        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            :disabled="!seed || generating"
            @click="emit('generate')"
          >
            <span
              :class="
                generating
                  ? 'i-material-symbols-progress-activity animate-spin'
                  : 'i-material-symbols-auto-awesome-rounded'
              "
              aria-hidden="true"
            />
            {{ generating ? "Finding matches…" : seed ? "Find matches" : "Pick a title first" }}
          </button>
          <button
            v-if="seed"
            type="button"
            class="flex w-12 items-center justify-center rounded-xl bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-label="Clear selected title"
            title="Clear selected title"
            @click="emit('clear')"
          >
            <span class="i-material-symbols-close-rounded text-xl" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.rec-shelf {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.5rem 0.25rem 0.75rem;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
</style>
