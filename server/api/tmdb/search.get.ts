export default defineEventHandler((event) => {
  const query = readQuery(event);
  return tmdbRequest(event, "/search/multi", {
    query: parseSearchQuery(query.query),
    page: parsePage(query.page),
    include_adult: false,
  });
});
