<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { DbMovie } from "~/utils/type";

const client = useSupabaseClient();

const saveList = ref<DbMovie[]>([]);

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
