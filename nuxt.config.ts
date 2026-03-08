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
    "convex-nuxt", // Temporarily disabled until CONVEX_URL is set
  ],
  // primevue: {
  //   components: {
  //     include: "*",
  //   },
  // },
  // css: ["primevue/resources/themes/aura-dark-purple/theme.css"],
  image: {
    domains: ["image.tmdb.org"],
  },

  // Convex configuration - uncomment after setting CONVEX_URL in .env.local
  // To get your CONVEX_URL:
  // 1. Run: npx convex dev
  // 2. Copy the deployment URL from the output
  // 3. Create .env.local file with: CONVEX_URL=https://your-deployment.convex.cloud
  convex: {
    url: process.env.CONVEX_URL,
  },
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
