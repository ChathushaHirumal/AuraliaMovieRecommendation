import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJoojLsJ7wGOxOj34WgARFbG8O-hU5XsU",
  authDomain: "auralia-movie-recommendation.firebaseapp.com",
  projectId: "auralia-movie-recommendation",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
