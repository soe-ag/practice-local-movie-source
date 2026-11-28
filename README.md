# Practice Local Movie Source

A Nuxt app for browsing movies and TV series, saving watchlists and favorites, and getting recommendations with TMDB and Convex.

## Features

- Browse trending and top-rated movies and series; search TMDB.
- Save movies and series to watchlist or favorites, then filter and sort them.
- Get recommendations from saved titles, with optional AI-generated suggestions.
- Use the read-only saved-list API from an AI agent; see [AI_AGENT_API.md](./AI_AGENT_API.md).

## Setup

Requirements: Node.js 24.19.0+ and pnpm.

1. Install dependencies: `pnpm install`
2. Create a `.env` file with the variables below.
3. Start Convex with `pnpm exec convex dev` and set `CONVEX_URL` to the deployment URL it provides.
4. Start Nuxt with `pnpm dev`.

```env
TMDB_API_KEY=your_tmdb_api_key
CONVEX_URL=your_convex_deployment_url
OPENROUTER_API_KEY=your_openrouter_api_key
```

`OPENROUTER_API_KEY` is optional; without it, recommendations fall back to TMDB. `AI_RECOMMENDATION_LIMIT_PER_HOUR` is an optional server-side limit for uncached AI requests.

## Main Routes

| Route | Description |
| --- | --- |
| `/` | Trending movies and search |
| `/TopRated` | Top-rated movies and TV series |
| `/WatchList` | Saved watchlist |
| `/Favorite` | Saved favorites |
| `/recommendations` | Recommendations from selected titles |

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm test` | Run tests |
| `pnpm tsc` | Type-check the project |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Build for production |
