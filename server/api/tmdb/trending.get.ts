type TrendingResponse = {
  total_results: number;
  results: Array<{ media_type?: string }>;
};

// Movies and TV series that are trending right now (this week by default).
export default defineEventHandler(async (event) => {
  const query = readQuery(event);
  const window = parseTrendingWindow(query.window);
  const page = parsePage(query.page);
  const response = await tmdbRequest<TrendingResponse>(event, `/trending/all/${window}`, { page });
  return keepMoviesAndTv(response);
});
