import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";

const moviesCol = collection(db, "movies2");

export async function getAllMovies() {
  const snap = await getDocs(moviesCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getMoviesSorted(field, direction = "desc") {
  const q = query(moviesCol, orderBy(field, direction));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getMoviesByGenre(genre) {
  const q = query(moviesCol, where("genre", "array-contains", genre));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
