# Practice Local Movie Source

A Nuxt 3 movie browsing application powered by the [TMDB API](https://www.themoviedb.org/) and [Supabase](https://supabase.com/).

## Features

- Browse trending/popular movies
- Search for movies and TV shows
- Add movies to a personal Watch List
- Add movies to a Favorites list
- User authentication via Supabase
- Sortable lists (by date added, year, rating)

## Tech Stack

- [Nuxt 3](https://nuxt.com/) — Vue-based full-stack framework
- [Supabase](https://supabase.com/) — database and authentication
- [PrimeVue](https://primevue.org/) — UI component library
- [UnoCSS](https://unocss.dev/) — utility-first CSS engine
- [TMDB API](https://developer.themoviedb.org/docs) — movie data source

## Prerequisites

- Node.js 18+
- A [TMDB API key](https://developer.themoviedb.org/docs/getting-started)
- A [Supabase](https://supabase.com/) project with `watchList` and `favoriteList` tables

## Environment Variables

Create a `.env` file in the project root:

```env
TMDB_API_KEY=your_tmdb_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

## Setup

Install dependencies:

```bash
npm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
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
