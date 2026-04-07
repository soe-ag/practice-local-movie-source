import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const normalizePosterPath = (value: string): string => {
  if (!value) return value;

  if (value.startsWith("/images/")) {
    return value;
  }

  if (value.startsWith("/")) {
    return value.split("?")[0];
  }

  const match = value.match(/\/t\/p\/(?:w\d+|original)(\/[^?]+)/);
  if (match?.[1]) {
    return match[1];
  }

  return value;
};

// Query to get all movies in the favorite list
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("favoriteList").collect();
  },
});

// Mutation to add a movie to the favorite list
export const add = mutation({
  args: {
    id: v.number(),
    title: v.string(),
    posterUrl: v.string(),
    rating: v.number(),
    release: v.union(v.number(), v.null()),
    type: v.string(),
    genres: v.optional(v.array(v.string())),
    overview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if movie already exists in favorites
    const existing = await ctx.db
      .query("favoriteList")
      .withIndex("by_movie_id", (q) => q.eq("id", args.id))
      .first();

    if (existing) {
      throw new Error("Movie already in favorites");
    }

    // Add current timestamp
    const addedAt = Date.now();
    const posterPath = normalizePosterPath(args.posterUrl);

    return await ctx.db.insert("favoriteList", {
      id: args.id,
      title: args.title,
      posterUrl: posterPath,
      rating: args.rating,
      release: args.release,
      type: args.type,
      genres: args.genres,
      overview: args.overview,
      addedAt,
    });
  },
});

// Mutation to remove a movie from the favorite list
export const remove = mutation({
  args: {
    id: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the movie by TMDB ID
    const movie = await ctx.db
      .query("favoriteList")
      .withIndex("by_movie_id", (q) => q.eq("id", args.id))
      .first();

    if (!movie) {
      throw new Error("Movie not found in favorites");
    }

    await ctx.db.delete(movie._id);
    return { success: true };
  },
});
