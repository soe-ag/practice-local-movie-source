import type { MediaType } from "~/utils/type";

export const parseRecommendationRequest = (body: {
  id?: unknown;
  type?: unknown;
}): { id: number; type: MediaType } => {
  if (!Number.isInteger(body?.id) || Number(body.id) <= 0) {
    throw new Error("A positive integer id is required.");
  }
  if (body.type !== "movie" && body.type !== "tv") {
    throw new Error("The type must be movie or tv.");
  }
  return { id: body.id as number, type: body.type };
};
