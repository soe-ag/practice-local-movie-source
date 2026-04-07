import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  watchList: defineTable({
    // TMDB movie ID (used as identifier in the app)
    id: v.number(),
    // Timestamp when movie was added
    // Accepts both string (PostgreSQL format from migration) and number (milliseconds)
    addedAt: v.union(v.string(), v.number()),
    // Movie title
    title: v.string(),
    // URL to movie poster image
    posterUrl: v.string(),
    // Movie rating (0-10 scale)
    rating: v.number(),
    // Release year (can be null)
    release: v.union(v.number(), v.null()),
    // Media type (e.g., "movie", "tv")
    type: v.string(),
    // Genre names for display in the UI drawer
    genres: v.optional(v.array(v.string())),
    // Movie overview/description (optional)
    overview: v.optional(v.string()),
  }).index("by_movie_id", ["id"]),
  // Note: by_addedAt index removed temporarily - can't index union types
  // Will add back after migrating all addedAt values to numbers

  favoriteList: defineTable({
    // TMDB movie ID (used as identifier in the app)
    id: v.number(),
    // Timestamp when movie was added
    // Accepts both string (PostgreSQL format from migration) and number (milliseconds)
    addedAt: v.union(v.string(), v.number()),
    // Movie title
    title: v.string(),
    // URL to movie poster image
    posterUrl: v.string(),
    // Movie rating (0-10 scale)
    rating: v.number(),
    // Release year (can be null)
    release: v.union(v.number(), v.null()),
    // Media type (e.g., "movie", "tv")
    type: v.string(),
    // Genre names for display in the UI drawer
    genres: v.optional(v.array(v.string())),
    // Movie overview/description (optional)
    overview: v.optional(v.string()),
  }).index("by_movie_id", ["id"]),
  // Note: by_addedAt index removed temporarily - can't index union types
  // Will add back after migrating all addedAt values to numbers
});
