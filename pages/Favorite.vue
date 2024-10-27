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
  <div class="py-2">
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
              class="i-material-symbols-heart-minus text-gray text-xl max-md:text-lg cursor-pointer hover:text-red"
              @click="removeFromFavoriteList(item.id)"
            />
          </div>
        </div>
        <div class="text-sm my-1">
          {{ item.title }}
        </div>
      </div>
    </div>
    <div v-else class="mx-4">No favorite movies.</div>
  </div>
</template>
