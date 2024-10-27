<script setup>
// const client = useSupabaseClient();

// const movies = ref([]);

// async function getMovies() {
//   console.log("app fn is called");
//   const { data } = await client.from("watchList").select();
//   console.log(data);
//   movies.value = data;
// }

// onMounted(() => {
//   getMovies();
// });
</script>

<template>
  <div class="font-sans bg-#0e1111">
    {{ movies }}
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
