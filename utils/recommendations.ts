import type {
  DbMovie,
  RecommendationCandidate,
  RecommendationFilters,
  RecommendationGroup,
} from "~/utils/type";

export const mediaKey = (item: Pick<DbMovie, "id" | "type">): string =>
  `${item.type}:${item.id}`;

type BuildRecommendationsOptions = {
  groups: RecommendationGroup[];
  excludedKeys: Set<string>;
  filters?: RecommendationFilters;
  limit?: number;
};

export const buildRecommendations = ({
  groups,
  excludedKeys,
  filters = {},
  limit,
}: BuildRecommendationsOptions): RecommendationCandidate[] => {
  const candidates = new Map<
    string,
    { candidate: RecommendationCandidate; seedKeys: Set<string> }
  >();

  for (const group of groups) {
    for (const candidate of group.candidates) {
      const key = mediaKey(candidate);
      if (excludedKeys.has(key)) continue;

      const existing = candidates.get(key);
      if (existing) {
        const sourceKey = mediaKey(group.seed);
        if (!existing.seedKeys.has(sourceKey)) {
          existing.seedKeys.add(sourceKey);
          existing.candidate.seedMatchCount = existing.seedKeys.size;
          existing.candidate.seedTitles.push(group.seed.title);
        }
        const seedGenres = new Set(group.seed.genres);
        for (const genre of candidate.genres) {
          if (
            seedGenres.has(genre) &&
            !existing.candidate.sharedGenres.includes(genre)
          ) {
            existing.candidate.sharedGenres.push(genre);
          }
        }
        continue;
      }

      const seedGenres = new Set(group.seed.genres);
      candidates.set(key, {
        candidate: {
          ...candidate,
          seedTitles: [group.seed.title],
          sharedGenres: candidate.genres.filter((genre) =>
            seedGenres.has(genre),
          ),
          seedMatchCount: 1,
          voteCount: candidate.voteCount ?? 0,
          popularity: candidate.popularity ?? 0,
        },
        seedKeys: new Set([mediaKey(group.seed)]),
      });
    }
  }

  const result = [...candidates.values()]
    .map(({ candidate }) => candidate)
    .filter((candidate) => !filters.type || candidate.type === filters.type)
    .filter((candidate) => {
      if (!filters.rating) return true;
      if (filters.rating === "lt7") return candidate.rating < 7;
      if (filters.rating === "7-7.5") {
        return candidate.rating >= 7 && candidate.rating < 7.5;
      }
      if (filters.rating === "7.5-8") {
        return candidate.rating >= 7.5 && candidate.rating <= 8;
      }
      if (filters.rating === "gt8") return candidate.rating > 8;
      return true;
    })
    .filter(
      (candidate) =>
        !filters.genre || candidate.genres.includes(filters.genre),
    )
    .sort(
      (a, b) =>
        b.seedMatchCount - a.seedMatchCount ||
        b.sharedGenres.length - a.sharedGenres.length ||
        b.rating - a.rating ||
        b.voteCount - a.voteCount ||
        b.popularity - a.popularity ||
        mediaKey(a).localeCompare(mediaKey(b)),
    );

  return typeof limit === "number" ? result.slice(0, limit) : result;
};

export const recommendationSummary = (
  candidate: RecommendationCandidate,
): string =>
  candidate.seedMatchCount > 1
    ? `Matches ${candidate.seedMatchCount} selections`
    : `Because you liked ${candidate.seedTitles[0]}`;
