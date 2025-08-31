import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJoojLsJ7wGOxOj34WgARFbG8O-hU5XsU",
  authDomain: "auralia-movie-recommendation.firebaseapp.com",
  projectId: "auralia-movie-recommendation",
  storageBucket: "auralia-movie-recommendation.appspot.com", // ✅ fixed
  messagingSenderId: "217275842851",
  appId: "1:217275842851:web:d490f403235748c7be0c96",
  measurementId: "G-17RHE8PL7Z"
};

const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();