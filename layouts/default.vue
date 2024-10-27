<script setup lang="ts">
const menuItems = ref([
  {
    label: "Home",
    icon: "i-material-symbols-home-rounded",
    route: "/",
  },

  {
    label: "Watch List",
    icon: "i-material-symbols-save-rounded",
    route: "/save",
  },
  {
    label: "Favorite",
    icon: "i-material-symbols-favorite",
    route: "/favorite",
  },
  {
    label: "Others",
    icon: "i-material-symbols-movie-filter",
    route: "/others",
  },
  {
    label: "Nuxt",
    icon: "i-logos-nuxt-icon",
    route: "/sample",
  },
]);

const route = useRoute();
</script>

<template>
  <div
    class="bg-[url('/images/pexels-pavel-danilyuk-7234404.jpg')] bg-cover bg-fixed bg-blend-overlay bg-center bg-#0e1111"
  >
    <nav class="grid grid-cols-5 items-center p-1">
      <!-- Left Menu Items -->
      <div class="col-span-4 flex gap-2">
        <div v-for="menu in menuItems.slice(0, 4)" :key="menu.label">
          <NuxtLink
            :to="menu.route"
            :class="{
              'text-blue-4 ': route.path === menu.route,
              'text-white hover:text-blue-4': route.path !== menu.route,
            }"
            class="no-underline rounded-1 m-1 w-fit px-2 h-8 flex justify-center items-center gap-1"
          >
            <div :class="menu.icon" />
            <div class="text-lg">{{ menu.label }}</div>
          </NuxtLink>
        </div>
      </div>

      <!-- Right Menu Item -->
      <div class="col-span-1 flex justify-end">
        <NuxtLink
          :to="menuItems[4].route"
          :class="{
            'text-green-4 ': route.path === menuItems[4].route,
            'text-white hover:text-green-4': route.path !== menuItems[4].route,
          }"
          class="no-underline rounded-1 m-1 w-fit px-2 h-8 flex justify-center items-center gap-1"
        >
          <div :class="menuItems[4].icon" class="text-xs" />
          <div class="text-lg">{{ menuItems[4].label }}</div>
        </NuxtLink>
      </div>
    </nav>
    <slot />
  </div>
</template>
