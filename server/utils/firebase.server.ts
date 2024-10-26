// server/utils/firebase.server.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCTADd-O23Afg4Xpu2bIVO9TO4FG-tqCw",
  authDomain: "practice-movie-source.firebaseapp.com",
  projectId: "practice-movie-source",
  storageBucket: "practice-movie-source.appspot.com",
  messagingSenderId: "317578698041",
  appId: "1:317578698041:web:4e7f6c7ca12f2e40675ce8",
  measurementId: "G-1YESWBQ331",
};
// Initialize Firebase only if no apps have been created
const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();
const db = getFirestore(firebaseApp);

export { db };
