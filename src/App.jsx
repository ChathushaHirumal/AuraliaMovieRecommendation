import { useEffect, useState } from "react";
import { ensureAnonSignIn, db } from "./firebase/init";
import { collection, getDocs } from "firebase/firestore";
import "./App.css";




export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title"); // default sort
  const [genreFilter, setGenreFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [randomMovie, setRandomMovie] = useState(null);



  useEffect(() => {
    (async () => {
      await ensureAnonSignIn();
      const snap = await getDocs(collection(db, "movies"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMovies(list);
      setLoading(false);
      setRecommendations(getTopRated(list, 3));
      setRandomMovie(getRandomMovie(list));

    })();
  }, []);

  // 🔍 Binary Search
  function binarySearch(movies, query) {
    let low = 0;
    let high = movies.length - 1;

    while (low <= high) {
      let mid = Math.floor((low + high) / 2);
      const title = movies[mid].title.toLowerCase();

      if (title === query.toLowerCase()) {
        return [movies[mid]]; // exact match
      } else if (title < query.toLowerCase()) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return [];
  }

  // ⚡ QuickSort
  function quickSort(arr, key) {
  if (arr.length <= 1) return arr;

  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];

  const isString = typeof pivot[key] === "string";

  const cmp = (a, b) => {
    if (isString) {
      return String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
    }
    return (a ?? 0) - (b ?? 0);
  };

  for (let i = 0; i < arr.length - 1; i++) {
    if (cmp(arr[i][key], pivot[key]) < 0) left.push(arr[i]);
    else right.push(arr[i]);
  }

  return [...quickSort(left, key), pivot, ...quickSort(right, key)];
}




  // 🎯 Get Top Rated Movies (using Priority Queue/Heap concept)
  function getTopRated(movies, k = 3) {
    return [...movies]
      .sort((a, b) => b.rating - a.rating) // simulate max-heap
      .slice(0, k);
  }

  // 🎲 Get Random Movie
  function getRandomMovie(movies) {
    if (!movies.length) return null;
    const index = Math.floor(Math.random() * movies.length);
    return movies[index];
  }




  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;

  // Sort movies
  let sortedMovies = [...movies];
  if (sortBy === "title") {
    sortedMovies = quickSort(sortedMovies, "title");
  } else if (sortBy === "rating") {
    sortedMovies = quickSort(sortedMovies, "rating").reverse(); // highest first
  } else if (sortBy === "year") {
    sortedMovies = quickSort(sortedMovies, "year").reverse(); // latest first
  }

  // Apply search + filters
  const results = (searchQuery
    ? binarySearch(
      [...sortedMovies].sort((a, b) => a.title.localeCompare(b.title)),
      searchQuery
    )
    : sortedMovies
  ).filter(m =>
    (genreFilter ? m.genre === genreFilter : true) &&
    (languageFilter ? m.language === languageFilter : true)
  );


  return (
    <>
      {/* Header (full width) */}
      <header className="app-header">
        <div className="header-content">
          <h2>🎬 Auralia</h2>
          <nav>
            <a href="#">Home</a>
            <a href="#">Genres</a>
            <a href="#">About</a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="app-container">
        <h1 className="app-title">Auralia — Movies</h1>

        <div className="controls">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="title">Title</option>
            <option value="rating">Rating</option>
            <option value="year">Year</option>
          </select>

          <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
            <option value="">All Genres</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Action">Action</option>
            <option value="Drama">Drama</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
            <option value="Animation">Animation</option>
            <option value="Crime">Crime</option>
            <option value="Fantasy">Fantasy</option>
          </select>

          <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Korean">Korean</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>

        {/* ⭐ Recommendations */}
        <div className="recommend-box">
          <h2>Recommended for You</h2>

          <h3>🔥 Top Rated</h3>
          <ul>
            {recommendations.map(m => (
              <li key={m.id}>
                <b>{m.title}</b> — ⭐ {m.rating}
              </li>
            ))}
          </ul>

          <h3>🎲 Random Pick</h3>
          {randomMovie && (
            <p><b>{randomMovie.title}</b> — ⭐ {randomMovie.rating}</p>
          )}
        </div>

        {/* Movie list */}
        <ul className="movie-list">
          {results.map(m => (
            <li key={m.id} className="movie-item">
              <span className="movie-title">{m.title}</span>
              <span className="movie-meta">⭐ {m.rating} • {m.year}</span>
            </li>
          ))}
        </ul>

        {!results.length && <p>No movies found.</p>}
      </div>

      {/* Footer (full width, non-fixed) */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2025 Auralia — Made with ❤️ for PDSA Coursework</p>
        </div>
      </footer>
    </>
  );

}
