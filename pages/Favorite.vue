<script setup lang="ts">
import type { DbMovie } from "~/utils/type";

const client = useSupabaseClient();

const toast = useToast();
const showToast = (type: "error" | "success", message: string) => {
  toast.add({
    severity: type,
    summary: type === "error" ? "Error" : "Success",
    detail:
      type === "error"
        ? message
        : `Movie (${message}) is removed from Favorite list.`,
    life: 3000,
  });
};

const { data, refresh } = await useAsyncData<DbMovie[]>(
  "favoriteList",
  async () => {
    const { data } = await client.from("favoriteList").select();
    return data as DbMovie[];
  }
);

const saveList = computed<DbMovie[]>(() => {
  return data.value ?? [];
});

const removeFromFavoriteList = async (id: number, name: string) => {
  console.log(id);
  const { error } = await client.from("favoriteList").delete().eq("id", id);
  showToast(error ? "error" : "success", error ? error.message : name);
  console.log(error);

  refresh();
};
</script>

<template>
  <div class="py-2">
    <Toast class="font-sans" />
    <div
      v-if="saveList.length"
      class="flex flex-wrap gap-2 justify-center items-center mx-4"
    >
      <div
        v-for="item in saveList"
        :key="item.id"
        class="w-50 h-70 m-2 p-1 flex flex-col max-md:w-36 max-md:h-58"
      >
        <div class="flex gap-2">
          <NuxtImg
            :src="item.posterUrl"
            class="rounded-1 w-35 max-md:w-30 max-md:h-45"
          />
          <div class="flex flex-col gap-2 justify-between">
            <div>
              <div
                v-if="item.rating"
                class="px-2 text-xs rounded-full bg-blue!"
              >
                {{ item.rating }}
              </div>
            </div>
            <div
              class="i-material-symbols-heart-minus text-gray text-xl max-md:text-lg cursor-pointer hover:text-red hover:animate-pulse"
              @click="removeFromFavoriteList(item.id, item.title)"
            />
          </div>
        </div>
        <div class="text-sm my-1">
          {{ item.title }} ({{ item.release ?? "-" }})
        </div>
      </div>
    </div>
    <div v-else class="mx-4">No favorite movies.</div>
  </div>
</template>
