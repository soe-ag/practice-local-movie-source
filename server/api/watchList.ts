import { db } from "../utils/firebase.server.js";
import { collection, addDoc } from "firebase/firestore";

export default defineEventHandler(async (event) => {
  const movieData = await readBody(event); // Get data from the request body

  try {
    console.log("DB Instance:", db); // Logging to check db instance

    // Add a new document with an auto-generated ID to the collection
    const docRef = await addDoc(collection(db, "firebaseWatchList"), movieData);
    return { message: "Movie data written successfully!", docId: docRef.id };
  } catch (error) {
    console.error("Error writing movie data:", error);
    return { error: `Failed to write movie data: ${error.message}` };
  }
});
