// https://nuxt.com/docs/api/configuration/nuxt-config

import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      tmdbApiKey: process.env.TMDB_API_KEY,
    },
  },

  modules: [
    "@nuxt/image",
    "@unocss/nuxt",
    "@primevue/nuxt-module",
    "@nuxt/eslint",
  ],
  // primevue: {
  //   components: {
  //     include: "*",
  //   },
  // },
  // css: ["primevue/resources/themes/aura-dark-purple/theme.css"],
  unocss: {
    nuxtLayers: true,
  },
  primevue: {
    usePrimeVue: true,
    options: {
      // ripple: true,
      // inputVariant: "filled",
      theme: {
        preset: Aura,
        // options: {
        //   prefix: "p",
        // darkModeSelector: "system",
        // darkModeSelector: ".my-app-dark",
        //   cssLayer: false,
        // },
      },
    },
  },
  css: ["~/assets/css/main.css"],
});
