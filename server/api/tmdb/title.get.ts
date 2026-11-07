export default defineEventHandler((event) => {
  const query = readQuery(event);
  const type = parseMediaType(query.type);
  const id = parseTmdbId(query.id);
  return tmdbRequest(event, `/${type}/${id}`);
});
