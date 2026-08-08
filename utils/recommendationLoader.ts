import type {
  DbMovie,
  RecommendationGroup,
  RecommendationSeed,
} from "~/utils/type";
import { mediaKey } from "~/utils/recommendations";

type FetchRecommendations = (seed: RecommendationSeed) => Promise<DbMovie[]>;

export const createRecommendationLoader = (
  fetchRecommendations: FetchRecommendations,
) => {
  const cache = new Map<string, DbMovie[]>();

  const fetchWithCache = async (seed: RecommendationSeed) => {
    const key = mediaKey(seed);
    const cached = cache.get(key);
    if (cached) return cached;
    const candidates = await fetchRecommendations(seed);
    cache.set(key, candidates);
    return candidates;
  };

  return {
    async load(seeds: RecommendationSeed[]): Promise<{
      groups: RecommendationGroup[];
      failedSeeds: string[];
    }> {
      const settled = await Promise.allSettled(seeds.map(fetchWithCache));
      const groups: RecommendationGroup[] = [];
      const failedSeeds: string[] = [];

      settled.forEach((result, index) => {
        const seed = seeds[index];
        if (!seed) return;
        if (result.status === "fulfilled") {
          groups.push({ seed, candidates: result.value });
        } else {
          failedSeeds.push(seed.title);
        }
      });

      return { groups, failedSeeds };
    },
  };
};
