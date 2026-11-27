import { ConvexHttpClient } from "convex/browser";
import { createError, getQuery, setResponseHeader, type H3Event } from "h3";
import { api } from "~/convex/_generated/api";

type SavedListName = "watchList" | "favoriteList";
type MediaType = "movie" | "tv";

const supportedMediaTypes = new Set<MediaType>(["movie", "tv"]);

const getMediaTypeFilter = (event: H3Event): MediaType | undefined => {
  const value = getQuery(event).type;

  if (value === undefined) return undefined;

  if (typeof value !== "string" || !supportedMediaTypes.has(value as MediaType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "The type query must be either 'movie' or 'tv'.",
    });
  }

  return value as MediaType;
};

export const getSavedList = async (event: H3Event, listName: SavedListName) => {
  setResponseHeader(event, "Cache-Control", "no-store");

  const mediaType = getMediaTypeFilter(event);
  const config = useRuntimeConfig(event);
  const convexUrl = config.public.convex?.url;

  if (!convexUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: "Saved lists are not configured.",
    });
  }

  const client = new ConvexHttpClient(convexUrl);

  try {
    const items =
      listName === "watchList"
        ? await client.query(api.watchList.get, {})
        : await client.query(api.favoriteList.get, {});
    const filteredItems = mediaType
      ? items.filter((item) => item.type === mediaType)
      : items;

    return {
      count: filteredItems.length,
      items: filteredItems,
    };
  } catch (error) {
    console.error(`Unable to read ${listName} from Convex.`, error);
    throw createError({
      statusCode: 502,
      statusMessage: "Unable to load the saved list.",
    });
  }
};
