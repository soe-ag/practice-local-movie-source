# AI Agent API

This document describes the public, read-only endpoints for agents that need to read the saved movie and TV lists. The API is not tied to a particular agent or protocol.

## Base URL

Production:

```text
https://practice-local-movie-source.vercel.app
```

For local development, use `http://localhost:3000`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/library/watchlist` | Read the watchlist |
| `GET` | `/api/library/favorites` | Read the favorites list |

Both endpoints accept the optional `type` query parameter:

| Value | Meaning |
| --- | --- |
| `movie` | Movies only |
| `tv` | TV series only |

Omit `type` to return all items. The value `tv` is used for series, matching the Convex records.

Examples:

```text
GET https://practice-local-movie-source.vercel.app/api/library/watchlist
GET https://practice-local-movie-source.vercel.app/api/library/favorites?type=tv
```

```bash
curl "https://practice-local-movie-source.vercel.app/api/library/watchlist"
curl "https://practice-local-movie-source.vercel.app/api/library/favorites?type=tv"
```

## Response

Successful requests return JSON with a count and the complete Convex documents. Fields are returned as stored; the API does not rewrite poster URLs or normalize timestamps.

```json
{
  "count": 1,
  "items": [
    {
      "_id": "convex-document-id",
      "_creationTime": 1795700000000,
      "id": 123,
      "title": "Example",
      "posterUrl": "/example-poster.jpg",
      "rating": 8.1,
      "release": 2023,
      "type": "movie",
      "addedAt": 1795700000000,
      "genres": ["Drama"],
      "overview": "Example overview."
    }
  ]
}
```

Each item includes Convex's `_id` and `_creationTime`, plus the saved fields:

- `id`: TMDB ID
- `title`
- `posterUrl`
- `rating`: TMDB rating on the app's 0–10 scale
- `release`: release year or `null`
- `type`: `movie` or `tv`
- `addedAt`: string or number, depending on the stored record
- `genres`: optional array of genre names
- `overview`: optional description

The optional `genres` and `overview` fields may be absent. `release` may be `null`.

## Access and behavior

- Authentication: none.
- Operations: read only; use `GET` only.
- Caching: responses use `Cache-Control: no-store`.
- Invalid `type`: returns `400`.
- Missing Convex configuration: returns `503`.
- Convex read failure: returns `502`.

These endpoints are publicly reachable. Anyone with the URL can read the complete watchlist or favorites list, including poster URLs and Convex metadata.

## Connecting an agent

For an agent that supports custom API tools or connectors, define two read-only GET tools using the paths above. Describe the optional `type` parameter as `movie` or `tv`, and provide the response shape from this document. No API credentials are required.
