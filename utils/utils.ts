export const convertToDbType = (item: RawMovie): DbMovie => {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "no title",
    posterUrl: item.poster_path
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : "/images/default-movie-poster.jpg",
    rating: Number(item.vote_average.toFixed(1)),
    release: item.first_air_date
      ? Number(item.first_air_date.split("-")[0])
      : item.release_date
      ? Number(item.release_date.split("-")[0])
      : null,
    type: item.media_type ?? "movie",
    addedAt: new Date(),
  };
};
