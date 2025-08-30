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
export async function getRecommendations(k = 10, histLimit = 5, allMovies = null) {
  const all = allMovies || await getAllMovies();
  const recent = getHistory(histLimit);

  if (!recent || recent.length === 0) return [];

  const byTitle = indexByTitle(all);
  const watchedSet = new Set(recent.map(t => String(t).toLowerCase()));

  // Collect "seed" feature sets from watched items
  const seeds = recent
    .map(t => byTitle.get(String(t).toLowerCase()))
    .filter(Boolean)
    .map(m => ({
    title: m.title,
    genre: toArr(m.genre),
    tags: toArr(m.tags)
  }));


  // Score each candidate against all seeds
  const scored = [];
  for (const cand of all) {
    const key = String(cand.title).toLowerCase();
    if (watchedSet.has(key)) continue; // don't recommend watched

    let bestWhy = { seed: null, gSim: 0, tSim: 0 };
    let score = 0;
    for (const s of seeds) {
        const gSim = jaccard(toArr(cand.genre), toArr(s.genre));
      const tSim = jaccard(toArr(cand.tags), toArr(s.tags));

      // weights: genres 0.6, tags 0.4 (tweakable)
      const partial = 0.6 * gSim + 0.4 * tSim;
      if (partial > (0.6 * bestWhy.gSim + 0.4 * bestWhy.tSim)) {
        bestWhy = { seed: s.title, gSim, tSim };
      }
      score += partial;
    }
    // bonus for rating to break ties (normalized 0..1 if rating 0..10)
    const ratingBonus = Math.min(Math.max((cand.rating ?? 0) / 10, 0), 1) * 0.1;
    scored.push({
      ...cand,
      _score: score / seeds.length + ratingBonus,
      _why: [`Because you watched "${bestWhy.seed}" (genre match ${(bestWhy.gSim*100).toFixed(0)}%, tag match ${(bestWhy.tSim*100).toFixed(0)}%)`]
    });
  }

  // Sort by score desc and take top k
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, k);
}

// Simple diversity re-rank by limiting max items per genre bucket.
// Greedy pass over a scored list.
export function diversifyByGenre(items, maxPerGenre = 2) {
  const out = [];
  const count = new Map();
  for (const m of items) {
    const genres = Array.isArray(m.genre) ? m.genre : [];
    // if movie has multiple genres, check the worst-case bucket
    const canPlace = genres.every(g => (count.get(g) || 0) < maxPerGenre);
    if (canPlace) {
      out.push(m);
      for (const g of genres) count.set(g, (count.get(g) || 0) + 1);
    }
  }
  // if we cut too many, fill with leftovers (still diverse first)
  if (out.length < items.length) {
    for (const m of items) {
      if (!out.includes(m)) out.push(m);
    }
  }
  return out;
}

// Convenience: get diversified recommendations
export async function getRecommendationsDiverse(k = 10, maxPerGenre = 2) {
  const base = await getRecommendations(k * 3); // extra to allow diversity
  const diversified = diversifyByGenre(base, maxPerGenre);
  return diversified.slice(0, k);
}
