# Convex Backend

This directory contains the [Convex](https://www.convex.dev/) backend for the Practice Local Movie Source app.

## Schema

Defined in `schema.ts`. Two tables are used:

### `watchList`

Stores movies and TV shows added to the user's watch list.

| Field | Type | Description |
|---|---|---|
| `id` | `number` | TMDB movie/show ID |
| `addedAt` | `string \| number` | Timestamp when the item was added |
| `title` | `string` | Movie or show title |
| `posterUrl` | `string` | Path to the poster image |
| `rating` | `number` | TMDB vote average (0–10) |
| `release` | `number \| null` | Release year |
| `type` | `string` | Media type (`"movie"` or `"tv"`) |
| `genres` | `string[]` (optional) | Genre names |
| `overview` | `string` (optional) | Plot summary |

Index: `by_movie_id` on `id`

### `favoriteList`

Stores movies and TV shows added to the user's favorites. Uses the same field structure as `watchList`.

Index: `by_movie_id` on `id`

## Functions

### `watchList.ts`

| Export | Type | Description |
|---|---|---|
| `get` | query | Returns all items in the watch list |
| `add` | mutation | Adds an item to the watch list (throws if already present) |
| `remove` | mutation | Removes an item from the watch list by TMDB `id` |

### `favoriteList.ts`

| Export | Type | Description |
|---|---|---|
| `get` | query | Returns all items in the favorites list |
| `add` | mutation | Adds an item to the favorites list (throws if already present) |
| `remove` | mutation | Removes an item from the favorites list by TMDB `id` |

## Usage in the App

The app uses [`convex-nuxt`](https://github.com/wobsoriano/convex-nuxt) to integrate Convex with Nuxt 3.
Set `CONVEX_URL` in your `.env` file to your Convex deployment URL.

```ts
// Example: reading the watch list in a Vue component
const watchList = useQuery(api.watchList.get);

// Example: adding an item
const addToWatchList = useMutation(api.watchList.add);
await addToWatchList({ id, title, posterUrl, rating, release, type });

// Example: removing an item
const removeFromWatchList = useMutation(api.watchList.remove);
await removeFromWatchList({ id });
```

## Deployment

Push functions to your Convex deployment:

```bash
npx convex deploy
```

Or run in development mode (auto-pushes on file changes):

```bash
npx convex dev
```

For all available CLI commands, run `npx convex -h` or visit the [Convex docs](https://docs.convex.dev/).
