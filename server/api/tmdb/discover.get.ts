import { createError } from "h3";

export default defineEventHandler((event) => {
  let request;
  try {
    request = parseDiscoverRequest(readQuery(event));
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : "Invalid request.",
    });
  }
  return tmdbRequest(event, `/discover/${request.type}`, buildDiscoverParams(request));
});
