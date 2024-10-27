<script setup lang="ts">
import type { DbMovie } from "~/utils/type";

const watchList = ref<DbMovie[]>([]);

// onMounted(() => {
//   const storedList = localStorage.getItem("watchList");
//   if (storedList) {
//     watchList.value = JSON.parse(storedList);
//   }
// });

// const handleWatchListRemove = (id: number) => {
//   watchList.value = removeFromList(id, "watchList");
// };

const client = useSupabaseClient();
const getList = async () => {
  const { data } = await client.from("watchList").select();
  watchList.value = data ? data : [];
};

onMounted(() => {
  getList();
});

const removeFromWatchList = async (id: number) => {
  console.log(id);
  const { error } = await client.from("watchList").delete().eq("id", id);
  getList();
  console.log(error);
};
</script>

<template>
  <div class="bg-none bg-#0e1111">
    <div>
      <div
        v-if="watchList.length"
        class="flex flex-wrap gap-2 justify-center items-center m-4"
      >
        <div
          v-for="item in watchList"
          :key="item.id"
          class="w-50 h-70 m-2 p-1 flex flex-col"
        >
          <div class="flex gap-2">
            <NuxtImg
              :src="item.posterUrl"
              class="rounded-1 b-10 b-gray-1"
              width="150"
              height="210"
            />
            <div class="flex flex-col gap-2 justify-between">
              <div>
                <Chip
                  v-if="item.rating"
                  :label="item.rating.toString()"
                  class="h-6 text-xs bg-blue!"
                />
              </div>
              <div class="flex flex-col gap-2">
                <div
                  class="i-material-symbols-delete-forever text-gray text-2xl cursor-pointer hover:text-red"
                  @click="() => removeFromWatchList(item.id)"
                />
              </div>
            </div>
          </div>
          <div class="text-sm my-1">
            {{ item.title }}
          </div>
        </div>
      </div>
      <div v-else>No saved items.</div>
    </div>
  </div>
</template>
