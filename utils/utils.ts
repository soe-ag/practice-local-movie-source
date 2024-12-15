export const convertToDbType = (item: RawMovieWithTotal): DbMovieWithTotal => {
  return {
    totalResults: item.total_results,
    movies: item.results.map((item) => {
      return {
        id: item.id,
        title: item.title ?? item.name ?? "no title",
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
          : "/images/default-movie-poster.jpg",
        rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 0,
        release: item.first_air_date
          ? Number(item.first_air_date.split("-")[0])
          : item.release_date
          ? Number(item.release_date.split("-")[0])
          : null,
        type: item.media_type ?? "movie",
        addedAt: new Date(),
        overview: item.overview
          ? item.overview.length > 220
            ? `${item.overview.slice(0, 220)} ...`
            : item.overview
          : "",
      };
    }),
  };
};
