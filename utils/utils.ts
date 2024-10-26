import type { Item, LocalList, SaveType } from "./type";

export const addToList = (item: SaveType, listType: LocalList) => {
  const storedList = localStorage.getItem(listType);
  const parsedList: SaveType[] = storedList ? JSON.parse(storedList) : [];

  // const itemSize = new Blob([JSON.stringify(item)]).size;

  if (!parsedList.some((storedItem) => storedItem.id === item.id)) {
    parsedList.push(item);
    localStorage.setItem(listType, JSON.stringify(parsedList));
    console.log("Item added to local storage:", item);
  } else {
    console.log("Item already exists in local storage");
  }
};

export const removeFromList = (id: number, listType: LocalList): SaveType[] => {
  const storedList = localStorage.getItem(listType);

  if (storedList) {
    const parsedWatchList = JSON.parse(storedList);

    const updatedList = parsedWatchList.filter(
      (item: { id: number }) => item.id !== id
    );

    localStorage.setItem(listType, JSON.stringify(updatedList));
    console.log(`Item with id ${id} has been removed from the watch list.`);
    return updatedList;
  } else {
    console.log("No list found in localStorage.");
    return [];
  }
};

// firebase api call function
export const addMovieToWatchListDb = async (movie: Item) => {
  const { data, error } = await useFetch("/api/watchList", {
    method: "POST",
    body: movie,
  });

  if (error.value) {
    console.error("Error adding movie:", error.value);
  } else {
    console.log("No erro at api function", data.value);
  }
};
