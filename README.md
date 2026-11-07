# Practice Local Movie Source

A Nuxt 4 movie browsing application powered by the [TMDB API](https://www.themoviedb.org/) and [Convex](https://www.convex.dev/).

## Features

- Browse popular/trending movies with pagination
- Browse top-rated movies and TV series with pagination
- Search for movies and TV shows (multi-search)
- Add/remove movies and TV shows to a personal Watch List
- Add/remove movies and TV shows to a Favorites list
- Sort lists by date added, release year, or rating
- Filter lists by type (movie/TV), rating range, and release year range
- Movie detail drawer with poster, overview, genres, and rating
- Personalized recommendations from selected Favorites or searched titles
- AI-tailored same-type recommendations with verified TMDB titles and match reasons
- Deterministic recommendation ranking and saved-list exclusions
- Dark mode support

## Pages

| Route              | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `/`                | Popular/trending movies with search                    |
| `/TopRated`        | Top-rated movies and TV series                         |
| `/WatchList`       | Personal watch list (sortable, filterable)             |
| `/Favorite`        | Favorites list (sortable, filterable)                  |
| `/recommendations` | Recommendations from Favorites or searched seed titles |
| `/login`           | Login page                                             |

## Project Structure

```
├── pages/               # Nuxt page components
│   ├── index.vue        # Home — trending movies + multi-search
│   ├── TopRated.vue     # Top-rated movies and TV series
│   ├── WatchList.vue    # Personal watch list
│   ├── Favorite.vue     # Favorites list
│   ├── Recommendations.vue # Personalized recommendations
│   └── login.vue        # Login page
├── components/          # Reusable Vue components
│   ├── ItemSmart.vue    # Smart item wrapper (chooses large/small layout)
│   ├── ItemLarge.vue    # Large movie card
│   ├── itemDumb.vue     # Small/compact movie card
│   ├── ItemSkeleton.vue     # Loading skeleton (small)
│   ├── ItemSkeletonLarge.vue # Loading skeleton (large)
│   ├── SavedListView.vue # Filter/sort toolbar + grid for Favorite and Watch List
│   └── MovieDrawer.vue  # Side drawer with movie details
├── composables/
│   ├── useMovieDrawer.ts  # Composable for drawer open/close state
│   ├── useRecommendations.ts # Recommendation page state and loading
│   └── useSavedListView.ts   # Filter/sort state for saved lists
├── server/
│   ├── api/tmdb/        # Proxy routes (popular, top-rated, search, title)
│   ├── api/recommendations/ # TMDB-based and AI recommendation endpoints
│   └── utils/           # TMDB proxy helper, AI/TMDB recommendation services
├── convex/              # Convex backend functions and schema
│   ├── schema.ts        # Database schema (watchList, favoriteList tables)
│   ├── watchList.ts     # Watch list queries and mutations
│   └── favoriteList.ts  # Favorite list queries and mutations
├── utils/
│   ├── type.ts          # Shared TypeScript types
│   ├── utils.ts         # convertToDbType helper
│   ├── savedList.ts     # Saved-list filtering, sorting, poster URL helpers
│   ├── recommendations.ts # Ranking, filtering, and pagination
│   ├── recommendationLoader.ts # Concurrent loading and session cache
│   └── genres.ts        # TMDB genre ID → name mapping
├── layouts/
│   ├── default.vue      # Default layout (nav + MovieDrawer)
│   └── login.vue        # Minimal layout for the login page
└── tests/               # Vitest unit tests
    ├── utils/            # Tests for utility functions
    └── convex/           # Tests for Convex schema and mutations
```

## Tech Stack

- [Nuxt 4](https://nuxt.com/) — Vue-based full-stack framework
- [Convex](https://www.convex.dev/) — real-time database backend
- [PrimeVue](https://primevue.org/) — UI component library
- [UnoCSS](https://unocss.dev/) — utility-first CSS engine
- [VueUse](https://vueuse.org/) — Vue composition utilities
- [TMDB API](https://developer.themoviedb.org/docs) — movie data source
- [Vitest](https://vitest.dev/) — unit testing framework

## Prerequisites

- Node.js 24.19.0+
- A [TMDB API key](https://developer.themoviedb.org/docs/getting-started)
- A [Convex](https://www.convex.dev/) project

## Environment Variables

Create a `.env` file in the project root:

```env
TMDB_API_KEY=your_tmdb_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
CONVEX_URL=your_convex_deployment_url
```

Optional: `AI_RECOMMENDATION_LIMIT_PER_HOUR` caps how many uncached AI recommendation requests each client can make per hour (default `100` in development, `5` in production). When AI is unavailable (limit reached, missing key, or all models failing) the page shows plain TMDB matches with a message saying why, and the server logs the exact reason (`[ai-recommendations] fell back to TMDB ...`). Restart the dev server after changing `.env`.

`TMDB_API_KEY` and `OPENROUTER_API_KEY` are server-only: the browser never calls TMDB directly, it goes through the `/api/tmdb/*` routes.

To get your `CONVEX_URL`, run `pnpm exec convex dev` and copy the deployment URL from the output.

## Setup

Install dependencies:

```bash
pnpm install
```

Initialize the Convex backend (creates `watchList` and `favoriteList` tables):

```bash
pnpm exec convex dev
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Run TypeScript type checking:

```bash
pnpm tsc
```

Run the linter:

```bash
pnpm lint
```

## Production

Build the application for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

Check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
