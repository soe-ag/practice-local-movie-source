// export const addToList = (item: SaveType, listType: LocalList) => {
//   const storedList = localStorage.getItem(listType);
//   const parsedList: SaveType[] = storedList ? JSON.parse(storedList) : [];

//   // const itemSize = new Blob([JSON.stringify(item)]).size;

//   if (!parsedList.some((storedItem) => storedItem.id === item.id)) {
//     parsedList.push(item);
//     localStorage.setItem(listType, JSON.stringify(parsedList));
//     console.log("Item added to local storage:", item);
//   } else {
//     console.log("Item already exists in local storage");
//   }
// };

// export const removeFromList = (id: number, listType: LocalList): SaveType[] => {
//   const storedList = localStorage.getItem(listType);

//   if (storedList) {
//     const parsedWatchList = JSON.parse(storedList);

//     const updatedList = parsedWatchList.filter(
//       (item: { id: number }) => item.id !== id
//     );

//     localStorage.setItem(listType, JSON.stringify(updatedList));
//     console.log(`Item with id ${id} has been removed from the watch list.`);
//     return updatedList;
//   } else {
//     console.log("No list found in localStorage.");
//     return [];
//   }
// };

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
