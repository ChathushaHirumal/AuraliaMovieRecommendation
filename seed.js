import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Firebase config from your .env
const firebaseConfig = {
    apiKey: "AIzaSyAJoojLsJ7wGOxOj34WgARFbG8O-hU5XsU",
    authDomain: "auralia-movie-recommendation.firebaseapp.com",
    projectId: "auralia-movie-recommendation",
    storageBucket: "auralia-movie-recommendation.firebasestorage.app",
    messagingSenderId: "217275842851",
    appId: "1:217275842851:web:d490f403235748c7be0c96",
    measurementId: "G-17RHE8PL7Z"
};


console.log("🔥 Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const movies = {
    inception: {
        title: "Inception",
        genre: "Sci-Fi",
        rating: 8.8,
        year: 2010,
        language: "English"
    },
    parasite: {
        title: "Parasite",
        genre: "Thriller",
        rating: 8.6,
        year: 2019,
        language: "Korean"
    },
    interstellar: {
        title: "Interstellar",
        genre: "Sci-Fi",
        rating: 8.7,
        year: 2014,
        language: "English"
    },
    darkknight: {
        title: "The Dark Knight",
        genre: "Action",
        rating: 9.0,
        year: 2008,
        language: "English"
    },
    avatar: {
        title: "Avatar",
        genre: "Fantasy",
        rating: 7.9,
        year: 2009,
        language: "English"
    },
    godfather: {
        title: "The Godfather",
        genre: "Crime",
        rating: 9.2,
        year: 1972,
        language: "English"
    },
    spiritedaway: {
        title: "Spirited Away",
        genre: "Animation",
        rating: 8.6,
        year: 2001,
        language: "Japanese"
    },
    joker: {
        title: "Joker",
        genre: "Drama",
        rating: 8.4,
        year: 2019,
        language: "English"
    },
    gladiator: {
        title: "Gladiator",
        genre: "Action",
        rating: 8.5,
        year: 2000,
        language: "English"
    },
    titanic: {
        title: "Titanic",
        genre: "Romance",
        rating: 7.8,
        year: 1997,
        language: "English"
    }
};

async function seed() {
    try {
        for (const [id, data] of Object.entries(movies)) {
            console.log(`➡️ Adding movie: ${id}`);
            await setDoc(doc(db, "movies", id), data);
            console.log(`✅ Added movie: ${id}`);
        }
        console.log("🎉 Seeding finished!");
    } catch (err) {
        console.error("❌ Error seeding Firestore:", err);
    } finally {
        process.exit(0);
    }
}

seed();
