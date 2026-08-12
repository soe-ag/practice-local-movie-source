<script setup lang="ts">
import type { DbMovie, MediaType } from "~/utils/type";
import { useToast } from "primevue/usetoast";
import { api } from "~/convex/_generated/api";
import { buildAiRecommendationRoute } from "~/utils/aiRecommendationNavigation";

const props = withDefaults(
  defineProps<{
    list: DbMovie[];
    isLarge?: boolean;
  }>(),
  { isLarge: false },
);

const toast = useToast();
const router = useRouter();
const pendingAiSeed = ref<{ id: number; type: MediaType } | null>(null);
const { mutate: addToWatchList } = useConvexMutation(api.watchList.add);
const { mutate: addToFavoriteList } = useConvexMutation(api.favoriteList.add);

const showToast = (
  type: "error" | "success",
  message: string,
  dbName?: string,
) => {
  toast.add({
    severity: type,
    summary: type === "error" ? "Error" : "Success",
    detail:
      type === "error" ? message : `Movie (${message}) is added to ${dbName}.`,
    life: 3000,
  });
};

const addMovie = async (item: DbMovie, dbName: string) => {
  try {
    // Prepare movie data (addedAt is set automatically by Convex mutations)
    const movieData = {
      id: item.id,
      title: item.title,
      posterUrl: item.posterUrl,
      rating: item.rating,
      release: item.release,
      type: item.type,
      genres: item.genres,
      overview: item.overview,
    };

    if (dbName === "watchList") {
      await addToWatchList(movieData);
    } else if (dbName === "favoriteList") {
      await addToFavoriteList(movieData);
    }

    pendingAiSeed.value = null;
    if (item.type === "movie" || item.type === "tv") {
      pendingAiSeed.value = { id: item.id, type: item.type };
    }
    toast.removeGroup("add-action");
    toast.add({
      severity: "success",
      summary: "Added",
      detail: `Movie (${item.title}) is added to ${dbName}.`,
      group: "add-action",
      life: 8000,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error) || "Failed to add movie";
    showToast("error", errorMessage, "");
    console.error(error);
  }
};

const findAiMatches = () => {
  const id = pendingAiSeed.value?.id;
  const type = pendingAiSeed.value?.type;
  if (!id || !type) return;
  toast.removeGroup("add-action");
  router.push(buildAiRecommendationRoute({ id, type }));
};
</script>

<template>
  <Toast group="add-action" position="bottom-right">
    <template #message="slotProps">
      <div class="flex flex-col gap-2">
        <span class="font-semibold">{{ slotProps.message.summary }}</span>
        <span class="text-sm">{{ slotProps.message.detail }}</span>
        <Button
          label="Find AI matches"
          size="small"
          class="self-start"
          @click="findAiMatches"
        />
      </div>
    </template>
  </Toast>
  <div v-if="props.isLarge" class="w-full max-w-[1920px] mx-auto mt-4 mb-0">
    <ItemLarge :list="props.list" is-list @add-movie="addMovie" />
  </div>
  <div
    v-else
    class="flex flex-wrap justify-center sm:justify-start items-start px-2 md:px-8 max-w-[1400px] mx-auto"
  >
    <ItemDumb :list="props.list" is-list @add-movie="addMovie" />
  </div>
</template>
