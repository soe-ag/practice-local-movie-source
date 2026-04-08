# Practice Local Movie Source

A Nuxt 3 movie browsing application powered by the [TMDB API](https://www.themoviedb.org/) and [Convex](https://www.convex.dev/).

## Features

- Browse popular/trending movies with pagination
- Browse top-rated movies and TV series with pagination
- Search for movies and TV shows (multi-search)
- Add/remove movies and TV shows to a personal Watch List
- Add/remove movies and TV shows to a Favorites list
- Sort lists by date added, release year, or rating
- Filter lists by type (movie/TV), rating range, and release year range
- Movie detail drawer with poster, overview, genres, and rating
- Dark mode support

## Pages

| Route | Description |
|---|---|
| `/` | Popular/trending movies with search |
| `/TopRated` | Top-rated movies and TV series |
| `/WatchList` | Personal watch list (sortable, filterable) |
| `/Favorite` | Favorites list (sortable, filterable) |
| `/login` | Login page |

## Tech Stack

- [Nuxt 3](https://nuxt.com/) — Vue-based full-stack framework
- [Convex](https://www.convex.dev/) — real-time database backend
- [PrimeVue](https://primevue.org/) — UI component library
- [UnoCSS](https://unocss.dev/) — utility-first CSS engine
- [VueUse](https://vueuse.org/) — Vue composition utilities
- [TMDB API](https://developer.themoviedb.org/docs) — movie data source

## Prerequisites

- Node.js 20.19.0+
- A [TMDB API key](https://developer.themoviedb.org/docs/getting-started)
- A [Convex](https://www.convex.dev/) project

## Environment Variables

Create a `.env` file in the project root:

```env
TMDB_API_KEY=your_tmdb_api_key
CONVEX_URL=your_convex_deployment_url
```

To get your `CONVEX_URL`, run `npx convex dev` and copy the deployment URL from the output.

## Setup

Install dependencies:

```bash
npm install
```

Initialize the Convex backend (creates `watchList` and `favoriteList` tables):

```bash
npx convex dev
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
npm test
```

## Production

Build the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
