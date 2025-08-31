import {
  collection, getDocs, query, orderBy, where,
  serverTimestamp, doc, setDoc
} from "firebase/firestore";

// (add this line under your firebase imports)
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

// Min-heap for Top-K by rating (O(n log k))
export async function getTopKByRatingHeap(k = 10) {
  const arr = await getAllMovies();
  if (!Array.isArray(arr) || arr.length === 0) return [];
  // simple in-file min-heap
  const heap = [];
  const less = (a, b) => a.rating < b.rating;
  const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
  const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (!less(heap[i], heap[p])) break; swap(i, p); i = p; } };
  const down = (i) => {
    const n = heap.length;
    while (true) {
      let l = (i << 1) + 1, r = l + 1, m = i;
      if (l < n && less(heap[l], heap[m])) m = l;
      if (r < n && less(heap[r], heap[m])) m = r;
      if (m === i) break; swap(i, m); i = m;
    }
  };
  for (const m of arr) {
    if (heap.length < k) { heap.push(m); up(heap.length - 1); }
    else if (m.rating > heap[0].rating) { heap[0] = m; down(0); }
  }
  // return sorted desc by rating
  return heap.sort((a, b) => b.rating - a.rating);
}

// Binary search for title prefix (O(log n + r)), case-insensitive
export function getByTitlePrefixBinary(list, q) {
  if (!q) return list;
  const query = q.toLowerCase();
  const arr = [...list].sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );
  const startsWith = (t, p) => t.toLowerCase().startsWith(p);
  // lower-bound binary search to first item with prefix
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].title.toLowerCase() < query) lo = mid + 1;
    else hi = mid;
  }
  const out = [];
  for (let i = lo; i < arr.length; i++) {
    if (startsWith(arr[i].title, query)) out.push(arr[i]);
    else break;
  }
  return out;
}

// Simple viewing history using localStorage (stack/queue hybrid)
const HISTORY_KEY = "auralia_history_titles";
export function pushHistory(item, max = 20) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    // normalize to objects {id,title}
    const newItem = typeof item === "string" ? { title: item } : item;
    // remove duplicate by title
    const idx = arr.findIndex(x => x.title === newItem.title);
    if (idx !== -1) arr.splice(idx, 1);
    arr.unshift(newItem);
    const trimmed = arr.slice(0, max);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch { /* ignore storage errors */ }
}


// Read recent history (move-to-front stack/queue), newest first
export function getHistory(limit = 20) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);

    const arr = raw ? JSON.parse(raw) : [];
    return arr.slice(0, limit).map(x => (x.title ? x.title : x));

  } catch {
    return [];
  }
}

// Clear history
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);

  } catch { /* ignore */ }
}

// Normalize to array
const toArr = (x) => Array.isArray(x) ? x : (x == null ? [] : [x]);

// Jaccard similarity of two string arrays (case-insensitive)
function jaccard(a = [], b = []) {
  const A = new Set(toArr(a).map(s => String(s).toLowerCase()));
  const B = new Set(toArr(b).map(s => String(s).toLowerCase()));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}


// Build a map: title -> movie (case-insensitive)
function indexByTitle(movies) {
  const map = new Map();
  for (const m of movies) map.set(String(m.title).toLowerCase(), m);
  return map;
}

// Recommend from recent history with explainable reasons.
// Scoring = w1*Jaccard(genre) + w2*Jaccard(tags) + small rating bonus
// AFTER (hardened & always-explain)
export async function getRecommendations(k = 10, histLimit = 5, allMovies = null) {
  const all = allMovies || await getAllMovies();
  const recent = getHistory(histLimit);
  if (!recent || recent.length === 0) return [];

  const byTitle = indexByTitle(all);
  const watchedSet = new Set(recent.map(t => String(t).toLowerCase()));

  // collect valid seed movies only
  const seeds = recent
    .map(t => byTitle.get(String(t).toLowerCase()))
    .filter(Boolean)
    .map(m => ({
      title: m.title,
      genre: toArr(m.genre),
      tags: toArr(m.tags)
    }));
  if (seeds.length === 0) return []; // nothing to compare with

  const scored = [];
  for (const cand of all) {
    const key = String(cand.title).toLowerCase();
    if (watchedSet.has(key)) continue;

    const cGenres = toArr(cand.genre);
    const cTags = toArr(cand.tags);

    let bestSeed = null, bestG = 0, bestT = 0, sum = 0;
    for (const s of seeds) {
      const g = jaccard(cGenres, s.genre);
      const t = jaccard(cTags, s.tags);
      const p = 0.6 * g + 0.4 * t;
      if (p > (0.6 * bestG + 0.4 * bestT)) { bestSeed = s.title; bestG = g; bestT = t; }
      sum += p;
    }

    const rating = Number.isFinite(cand.rating) ? cand.rating : 0;
    const ratingBonus = Math.max(0, Math.min(1, rating / 10)) * 0.1;

    const avg = sum / seeds.length;
    const reason =
      bestSeed
        ? `Because you watched "${bestSeed}" (genre ${(bestG * 100).toFixed(0)}%, tags ${(bestT * 100).toFixed(0)}%)`
        : "Because it’s similar to your recent watches.";

    scored.push({ ...cand, _score: avg + ratingBonus, _why: [reason] });
  }

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, k);
}


// Simple diversity re-rank by limiting max items per genre bucket.
// Greedy pass over a scored list.

export function diversifyByGenre(items, maxPerGenre = 2) {
  const out = [];
  const taken = new Set();
  const count = new Map();

  // 1) strict pass: respect caps
  for (const m of items) {
    const genres = Array.isArray(m.genre) ? m.genre : [];
    if (genres.length === 0) continue; // postpone unknowns
    const ok = genres.every(g => (count.get(g) || 0) < maxPerGenre);
    if (ok) {
      out.push(m); taken.add(m);
      for (const g of genres) count.set(g, (count.get(g) || 0) + 1);
    }
  }

  // 2) fill remaining spots with leftovers (including no-genre items), keep ranking
  for (const m of items) {
    if (!taken.has(m)) out.push(m);
  }
  return out;
}



export async function getRecommendationsDiverse(k = 10, maxPerGenre = 2, allMovies = null) {
  const base = await getRecommendations(k * 3, 5, allMovies); // reuse loaded movies
  const diversified = diversifyByGenre(base, maxPerGenre);
  return diversified.slice(0, k);
}





// Create: add a movie document to Firestore

// generate a slug if custom id isn't provided
function slugify(title = "", year) {
  const base = String(title).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return year ? `${base}-${year}` : (base || `movie-${Date.now()}`);
}

export async function addMovie(data) {
  const payload = {
    title: data.title?.trim(),
    year: data.year ? Number(data.year) : null,
    rating: data.rating ? Math.max(0, Math.min(10, Number(data.rating))) : 0,
    genre: Array.isArray(data.genre)
      ? data.genre
      : String(data.genre || "").split(",").map(s => s.trim()).filter(Boolean),
    tags: Array.isArray(data.tags)
      ? data.tags
      : String(data.tags || "").split(",").map(s => s.trim()).filter(Boolean),
    posterUrl: data.posterUrl?.trim() || "",
    language:  data.language?.trim() || "Unknown",
    createdAt: serverTimestamp(),
  };
  if (!payload.title) throw new Error("Title is required");

  const customId = (data.id?.trim()) || slugify(payload.title, payload.year);
  const ref = doc(moviesCol, customId);
  await setDoc(ref, { ...payload, id: customId });

  return true;
}
