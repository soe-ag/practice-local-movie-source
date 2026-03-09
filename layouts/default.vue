<script setup lang="ts">
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark();
const toggleDark = useToggle(isDark);

const menuItems = ref([
  {
    label: "Home",
    icon: "i-material-symbols-home-rounded",
    route: "/",
  },

  {
    label: "Watch List",
    icon: "i-material-symbols-save-rounded",
    route: "/watchlist",
  },
  {
    label: "Favorite",
    icon: "i-material-symbols-favorite",
    route: "/favorite",
  },
  {
    label: "Top Rated",
    icon: "i-material-symbols-movie-filter",
    route: "/toprated",
  },
  // {
  //   label: "",
  //   icon: "i-logos-nuxt-icon",
  //   route: "/sample",
  // },
]);

const route = useRoute();
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-[url('/images/pexels-pavel-danilyuk-7234404.jpg')] bg-cover bg-fixed bg-blend-overlay bg-center bg-gray-50 dark:bg-#0e1111 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <nav
      class="grid grid-cols-5 items-center p-1 bg-white/80 dark:bg-#0e1111/90 backdrop-blur-md shadow-sm transition-colors duration-300"
    >
      <!-- Left Menu Items -->
      <div class="col-span-4 flex gap-2">
        <div v-for="menu in menuItems" :key="menu.label">
          <NuxtLink
            :to="menu.route"
            :class="{
              'text-orange-500 font-semibold': route.path === menu.route,
              'text-gray-700 dark:text-white hover:text-orange-500':
                route.path !== menu.route,
            }"
            class="no-underline rounded-1 m-1 w-fit px-2 h-8 flex justify-center items-center gap-1"
          >
            <div :class="menu.icon" />
            <div class="text-lg max-md:hidden">{{ menu.label }}</div>
          </NuxtLink>
        </div>
      </div>

      <!-- Right Menu Item -->
      <div class="col-span-1 flex justify-end items-center gap-1 pr-2">
        <button
          class="text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors cursor-pointer text-xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 outline-none border-none bg-transparent flex items-center justify-center"
          @click="toggleDark()"
        >
          <div
            :class="
              isDark
                ? 'i-material-symbols-light-mode'
                : 'i-material-symbols-dark-mode'
            "
          />
        </button>

        <!-- <NuxtLink
          :to="menuItems[4].route"
          :class="{
            'text-orange-500 font-semibold': route.path === menuItems[4].route,
            'text-gray-700 dark:text-white hover:text-orange-500':
              route.path !== menuItems[4].route,
          }"
          class="no-underline rounded-1 m-1 w-fit px-2 h-8 flex justify-center items-center gap-1"
        >
          <div :class="menuItems[4].icon" class="text-xs" />
          <div class="text-lg">{{ menuItems[4].label }}</div>
        </NuxtLink> -->
      </div>
    </nav>
    <main class="flex-grow">
      <slot />
    </main>

    <!-- Footer -->
    <footer
      class="w-full py-4 mt-auto bg-white/40 dark:bg-black/40 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 transition-colors duration-300"
    >
      <div
        class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4"
      >
        <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
          © {{ new Date().getFullYear() }} MovieSource. All rights reserved.
        </div>

        <div
          class="flex items-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span class="opacity-70 italic">Powered by</span>
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-1 hover:scale-110 transition-transform cursor-default"
            >
              <div class="i-logos-vue text-lg" title="Vue.js" />
              <span>Vue</span>
            </div>
            <div
              class="flex items-center gap-1 hover:scale-110 transition-transform cursor-default"
            >
              <div class="i-logos-nuxt-icon text-lg" title="Nuxt.js" />
              <span>Nuxt</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
