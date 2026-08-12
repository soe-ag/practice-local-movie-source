import type { MediaType } from "~/utils/type";

export const buildAiRecommendationRoute = (seed: {
  id: number;
  type: MediaType;
}) => ({
  path: "/recommendations",
  query: {
    tab: "findSimilar",
    id: String(seed.id),
    type: seed.type,
  },
});

export const parseAiRecommendationRoute = (query: Record<string, unknown>) => {
  if (query.tab !== "findSimilar") return null;
  const type = query.type === "movie" || query.type === "tv" ? query.type : null;
  const id = Number(query.id);
  if (!type || !Number.isInteger(id) || id <= 0) return null;
  return { id, type } satisfies { id: number; type: MediaType };
};
