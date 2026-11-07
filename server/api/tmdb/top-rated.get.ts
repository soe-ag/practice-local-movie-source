export default defineEventHandler((event) => {
  const query = readQuery(event);
  const type = parseMediaType(query.type);
  const page = parsePage(query.page);
  return tmdbRequest(event, `/${type}/top_rated`, { page });
});
