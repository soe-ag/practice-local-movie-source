<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { DbMovie } from "~/utils/type";

const saveList = ref<DbMovie[]>([]);

// onMounted(() => {
//   const storedList = localStorage.getItem("favoriteList");
//   if (storedList) {
//     saveList.value = JSON.parse(storedList);
//   }
// });

// const handleWatchListRemove = (id: number) => {
//   console.log(id);
//   const storedWatchList = localStorage.getItem("watchList");

//   if (storedWatchList) {
//     const watchList = JSON.parse(storedWatchList);
//     const updatedWatchList = watchList.filter(
//       (item: { id: number }) => item.id !== id
//     );

//     localStorage.setItem("watchList", JSON.stringify(updatedWatchList));
//     console.log(`Item with id ${id} has been removed from the watch list.`);
//   } else {
//     console.log("No watch list found in localStorage.");
//   }
// };
const client = useSupabaseClient();

const getList = async () => {
  const { data } = await client.from("favoriteList").select();
  saveList.value = data ? data : [];
};

onMounted(() => {
  getList();
});

const removeFromFavoriteList = async (id: number) => {
  console.log(id);
  const { error } = await client.from("favoriteList").delete().eq("id", id);
  getList();
  console.log(error);
};
</script>

<template>
  <div>
    <div>
      <div
        v-if="saveList.length"
        class="flex flex-wrap gap-2 justify-center items-center m-4"
      >
        <div
          v-for="item in saveList"
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
              <div
                class="i-material-symbols-heart-minus text-gray text-xl cursor-pointer hover:text-red"
                @click="removeFromFavoriteList(item.id)"
              />
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
