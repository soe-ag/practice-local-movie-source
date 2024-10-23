<script setup lang="ts">
export type ListType = {
  id: number;
  title?: string;
  name?: string;

  poster_path: string;
  first_air_date?: string;
  release_date?: string;
  media_type: string;
  vote_average: number;
};

const props = defineProps<{
  list: ListType[];
}>();
</script>

<template>
  <div class="grid grid-cols-5 gap-2 justify-center items-center m-auto w-70vw">
    <div
      v-for="item in props.list"
      :key="item.id"
      class="w-50 h-70 m-2 p-1 flex flex-col"
    >
      <div class="flex gap-2">
        <NuxtImg
          :src="
            item.poster_path
              ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
              : '/images/default-movie-poster.jpg'
          "
          class="relative rounded-1 b-10 b-gray-1"
          width="150"
          height="210"
        />
        <div class="absolute w-36 my-1 text-xs flex justify-end">
          <div class="bg-green rounded-full px-2 w-fit mr-0">
            {{ item.vote_average.toFixed(1) }}
          </div>
        </div>
        <div class="flex flex-col gap-2 justify-between">
          <div>
            <Chip
              v-if="item.media_type"
              :label="item.media_type"
              class="h-6 text-xs w-fit mb-1"
            />
            <!-- <Chip
              v-if="item.vote_average"
              :label="item.vote_average.toFixed(1)"
              class="h-6 text-xs bg-blue!"
            /> -->
          </div>
          <div class="w-8">
            <div
              class="i-material-symbols-favorite text-gray text-xl cursor-pointer hover:text-red mb-1 mx-auto"
              @click="() => addToList(item, 'favoriteList')"
            />

            <div
              class="i-material-symbols-add-rounded text-gray text-2xl cursor-pointer hover:text-green mx-auto"
              @click="() => addToList(item, 'watchList')"
            />
          </div>
        </div>
      </div>
      <div class="my-1">
        {{ item.title ?? item.name }}
        {{
          item.first_air_date
            ? `(${item.first_air_date.split("-")[0]})`
            : item.release_date
            ? `(${item.release_date.split("-")[0]})`
            : ""
        }}
      </div>
    </div>
  </div>
</template>
