export default defineEventHandler((event) => {
  const page = parsePage(readQuery(event).page);
  return tmdbRequest(event, "/movie/popular", { page });
});
