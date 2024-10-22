<script setup lang="ts">
const menuItems = ref([
  {
    label: "Home",
    icon: "i-material-symbols-home-rounded",
    route: "/",
  },
  {
    label: "Nuxt",
    icon: "i-logos-nuxt-icon",
    route: "/sample",
  },
  {
    label: "Save",
    icon: "i-material-symbols-save-rounded",
    route: "/save",
  },
  {
    label: "Others",
    icon: "i-material-symbols-movie-filter",
    route: "/others",
  },
]);
</script>

<template>
  <div
    class="bg-[url('/images/pexels-pavel-danilyuk-7234404.jpg')] bg-cover bg-fixed bg-blend-overlay bg-center bg-no-repeat h-100vh bg-gray-8 h-100vh"
  >
    <nav class="flex justify-start gap-2 items-center p-1">
      <div v-for="menu in menuItems" :key="menu.label">
        <NuxtLink
          :to="menu.route"
          class="text-white text-lg no-underline rounded-1 m-1 w-25 h-8 flex justify-center items-center gap-1 hover:bg-blue-6"
        >
          <div :class="menu.icon" />
          <div>{{ menu.label }}</div>
        </NuxtLink>
      </div>
    </nav>
    <slot />
  </div>
</template>
