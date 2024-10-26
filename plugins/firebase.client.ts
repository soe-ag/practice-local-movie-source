// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getFirestore } from "firebase/firestore";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional

// export default defineNuxtPlugin(() => {
//   const firebaseConfig = {
//     apiKey: "AIzaSyCCTADd-O23Afg4Xpu2bIVO9TO4FG-tqCw",
//     authDomain: "practice-movie-source.firebaseapp.com",
//     projectId: "practice-movie-source",
//     storageBucket: "practice-movie-source.appspot.com",
//     messagingSenderId: "317578698041",
//     appId: "1:317578698041:web:4e7f6c7ca12f2e40675ce8",
//     measurementId: "G-1YESWBQ331",
//   };

//   const firebaseApp = initializeApp(firebaseConfig);
//   const analytics = getAnalytics(firebaseApp);
//   const db = getFirestore(firebaseApp);

//   return {
//     provide: {
//       firebaseApp,
//       analytics,
//       db,
//     },
//   };
// });

// // export async function fetchMovies() {
// //   const moviesCollection = collection(db, "firebaseWatchList");
// //   const querySnapshot = await getDocs(moviesCollection);
// //   const movies = querySnapshot.docs.map((doc) => ({
// //     id: doc.id,
// //     ...doc.data(),
// //   }));
// //   return movies;
// // }
